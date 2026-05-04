// ============================================================
// migrate-smile.js
// Migración completa: Smile (MySQL) → Clinident (PostgreSQL/PostgREST)
// Ejecutar: node migrate-smile.js
// ============================================================

const fs = require('fs');
const path = require('path');

// ============ CONFIGURACIÓN ============
const API = 'https://clinident.trycompany.es/api';
const BATCH = 50;
const DUMP_FILE = path.join(__dirname, 'BackUpSmile.sql');
const DEFAULT_PASSWORD = 'La92.2026';
const DEFAULT_DOCTOR_ID = '9889d9a2-b549-4aea-8447-66f75d671883'; // doctor@la92.com
const ADMIN_ID = '547d3b75-ed88-4918-83aa-3a6ea0683ccc'; // admin@la92.com

// Maps old → new IDs
const doctorMap = new Map();  // persona.id_persona → user UUID
const patientMap = new Map(); // document_number → patient UUID
const invoiceMap = new Map(); // factura.numero → invoice UUID

// Stats
const stats = {
    doctors:          { total: 0, migrated: 0, errors: 0, skipped: 0 },
    patients:         { total: 0, migrated: 0, errors: 0, skipped: 0 },
    appointments:     { total: 0, migrated: 0, errors: 0, skipped: 0 },
    clinical_history: { total: 0, migrated: 0, errors: 0, skipped: 0 },
    invoices:         { total: 0, migrated: 0, errors: 0, skipped: 0 },
    payments:         { total: 0, migrated: 0, errors: 0, skipped: 0 },
    prescriptions:    { total: 0, migrated: 0, errors: 0, skipped: 0 }
};

// ============ API HELPERS ============
async function apiPost(endpoint, data) {
    const res = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        },
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`POST ${endpoint} ${res.status}: ${errText}`);
    }
    return res.json();
}

async function apiGet(endpoint) {
    const res = await fetch(`${API}${endpoint}`, {
        headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`GET ${endpoint} ${res.status}`);
    return res.json();
}

// ============ MYSQL DUMP PARSER ============
function parseInserts(sql, tableName) {
    const rows = [];
    const pattern = 'INSERT INTO `' + tableName + '` VALUES';
    let pos = 0;

    while (true) {
        const idx = sql.indexOf(pattern, pos);
        if (idx === -1) break;

        let start = idx + pattern.length;
        while (start < sql.length && ' \t\r\n'.includes(sql[start])) start++;

        const result = parseValueTuples(sql, start);
        rows.push(...result.rows);
        pos = result.endPos;
    }

    return rows;
}

function parseValueTuples(sql, i) {
    const rows = [];

    while (i < sql.length) {
        while (i < sql.length && ' \t\r\n'.includes(sql[i])) i++;
        if (sql[i] !== '(') break;

        const row = [];
        i++; // skip (

        while (i < sql.length && sql[i] !== ')') {
            while (i < sql.length && ' \t'.includes(sql[i])) i++;

            if (sql[i] === "'") {
                // String value
                i++;
                let val = '';
                while (i < sql.length) {
                    if (sql[i] === '\\') {
                        i++;
                        if (i >= sql.length) break;
                        switch (sql[i]) {
                            case "'": val += "'"; break;
                            case "\\": val += "\\"; break;
                            case "r": val += "\r"; break;
                            case "n": val += "\n"; break;
                            case "0": val += ""; break;
                            case "t": val += "\t"; break;
                            default: val += sql[i];
                        }
                        i++;
                    } else if (sql[i] === "'" && i + 1 < sql.length && sql[i + 1] === "'") {
                        val += "'";
                        i += 2;
                    } else if (sql[i] === "'") {
                        i++;
                        break;
                    } else {
                        val += sql[i];
                        i++;
                    }
                }
                row.push(val);
            } else if (sql.substring(i, i + 4).toUpperCase() === 'NULL') {
                row.push(null);
                i += 4;
            } else {
                // Number or other literal
                let val = '';
                while (i < sql.length && sql[i] !== ',' && sql[i] !== ')') {
                    val += sql[i];
                    i++;
                }
                val = val.trim();
                if (val === '') {
                    row.push(null);
                } else {
                    const num = Number(val);
                    row.push(isNaN(num) ? val : num);
                }
            }

            while (i < sql.length && ' \t'.includes(sql[i])) i++;
            if (sql[i] === ',') i++;
        }

        if (sql[i] === ')') i++;
        rows.push(row);

        while (i < sql.length && ' \t\r\n'.includes(sql[i])) i++;
        if (sql[i] === ',') {
            i++;
        } else {
            if (sql[i] === ';') i++;
            break;
        }
    }

    return { rows, endPos: i };
}

// ============ HELPERS ============
function cleanStr(s) {
    if (s === null || s === undefined) return null;
    return String(s).replace(/\r\n/g, '\n').replace(/\r/g, '').trim() || null;
}

function cleanDate(d) {
    if (!d) return null;
    const s = String(d).trim();
    if (s === '0000-00-00' || s === '' || s === 'NULL') return null;
    if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
    return s.substring(0, 10); // YYYY-MM-DD only
}

function generateEmail(name, id) {
    const clean = name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z ]/g, '')
        .trim()
        .replace(/\s+/g, '.');
    return clean ? `${clean}.${id}@la92.com` : `doctor.${id}@la92.com`;
}

function addMinutesToTime(timeStr, minutes) {
    if (!timeStr) return '09:30:00';
    const parts = timeStr.split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    const dur = parseInt(minutes) || 30;
    const total = h * 60 + m + dur;
    const newH = Math.floor(total / 60) % 24;
    const newM = total % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00`;
}

function mapAppointmentStatus(estado) {
    const map = {
        0: 'scheduled', 1: 'confirmed', 2: 'completed',
        3: 'cancelled', 4: 'no_show', 5: 'cancelled',
        6: 'in_progress', 7: 'in_progress'
    };
    return map[parseInt(estado)] || 'scheduled';
}

function mapPaymentMethod(forma) {
    const map = {
        1: 'cash', 2: 'check', 3: 'other',
        4: 'card', 5: 'card', 6: 'transfer', 7: 'other'
    };
    return map[parseInt(forma)] || 'other';
}

function mapGender(sexo) {
    if (!sexo) return null;
    return sexo.toUpperCase() === 'M' ? 'Masculino' :
           sexo.toUpperCase() === 'F' ? 'Femenino' : null;
}

// ============ PASO 1: DOCTORES ============
async function migrateDoctors(personas) {
    console.log('\n=== PASO 1: DOCTORES ===');

    // Exclude fake/system entries
    const EXCLUDE_NAMES = ['CONSULTORIO', 'BLANQUEAMIENTO', 'CONSUL', 'CONSUL  LA 92'];
    const doctors = personas.filter(p => {
        const tipo = parseInt(p[5]);
        const nombre = cleanStr(p[3]);
        if (tipo !== 1 || !nombre || nombre.length < 3) return false;
        // Exclude system/fake entries
        if (EXCLUDE_NAMES.some(ex => nombre.toUpperCase().includes(ex))) return false;
        // Exclude empty or single-word entries that look like IDs
        if (nombre.split(/\s+/).filter(Boolean).length < 2) return false;
        return true;
    });

    stats.doctors.total = doctors.length;
    console.log(`Encontrados ${doctors.length} doctores (tipo_persona=1)`);

    // Hash password once via RPC
    const hashRes = await fetch(`${API}/rpc/hash_password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: DEFAULT_PASSWORD })
    });
    const passwordHash = await hashRes.json();
    console.log('Hash generado para password por defecto');

    for (const doc of doctors) {
        const id = parseInt(doc[0]);
        const nombre = cleanStr(doc[3]);
        const email = generateEmail(nombre, id);

        try {
            // Create user
            const [user] = await apiPost('/users', [{
                email: email,
                password_hash: passwordHash
            }]);

            // Create profile
            await apiPost('/profiles', [{
                user_id: user.id,
                full_name: nombre,
                specialty: 'Odontologia'
            }]);

            // Create role
            await apiPost('/user_roles', [{
                user_id: user.id,
                role: 'doctor'
            }]);

            doctorMap.set(id, user.id);
            stats.doctors.migrated++;
            console.log(`  + ${nombre} (${email})`);
        } catch (err) {
            console.error(`  x Error ${nombre}: ${err.message.substring(0, 100)}`);
            stats.doctors.errors++;
        }
    }

    console.log(`Doctores migrados: ${stats.doctors.migrated}/${stats.doctors.total}`);
}

// ============ PASO 2: PACIENTES ============
async function migratePatients(pacientes) {
    console.log('\n=== PASO 2: PACIENTES ===');

    const records = [];
    const seenDocs = new Set();

    for (const p of pacientes) {
        const eliminado = parseInt(p[40]);
        if (eliminado === 1) { stats.patients.skipped++; continue; }

        // Document number: cedula (pos 2), fallback to id (pos 0)
        let docNumber = cleanStr(p[2]) || cleanStr(p[0]);
        if (!docNumber || docNumber === '*' || docNumber === '**') {
            stats.patients.skipped++;
            continue;
        }

        if (seenDocs.has(docNumber)) { stats.patients.skipped++; continue; }
        seenDocs.add(docNumber);

        // Names: prefer individual fields (64-67), fallback to nombre (1)
        let firstName = cleanStr(p[64]);
        let secondName = cleanStr(p[65]);
        let lastName1 = cleanStr(p[66]);
        let lastName2 = cleanStr(p[67]);

        if (!firstName && !lastName1) {
            const fullName = cleanStr(p[1]) || 'SIN NOMBRE';
            const parts = fullName.split(/\s+/).filter(Boolean);
            if (parts.length === 1) {
                firstName = parts[0];
                lastName1 = 'N/A';
            } else if (parts.length === 2) {
                firstName = parts[0];
                lastName1 = parts[1];
            } else if (parts.length === 3) {
                firstName = parts[0];
                lastName1 = parts[1];
                lastName2 = parts[2];
            } else {
                firstName = parts.slice(0, 2).join(' ');
                lastName1 = parts.slice(2).join(' ');
            }
        }

        firstName = firstName || 'N/A';
        if (secondName) firstName = firstName + ' ' + secondName;
        const lastName = [lastName1, lastName2].filter(Boolean).join(' ') || 'N/A';

        // Phone: celular (10), telresidencia (8), teloficina (9)
        let phone = cleanStr(p[10]) || cleanStr(p[8]) || cleanStr(p[9]);
        if (!phone || phone === '*') phone = 'N/A';

        // Document type
        let docType = cleanStr(p[5]) || 'CC';

        // Email - skip placeholder values
        let email = cleanStr(p[13]);
        if (email === '*' || email === '**') email = null;

        records.push({
            _docNumber: docNumber,
            first_name: firstName,
            last_name: lastName,
            document_type: docType,
            document_number: docNumber,
            phone: phone,
            email: email,
            birth_date: cleanDate(p[4]),
            gender: mapGender(cleanStr(p[6])),
            address: cleanStr(p[7]) === '*' ? null : cleanStr(p[7]),
            city: cleanStr(p[22]) || null,
            notes: cleanStr(p[39]) || null,
            created_by: ADMIN_ID
        });
    }

    stats.patients.total = records.length;
    console.log(`Preparados ${records.length} pacientes (${stats.patients.skipped} omitidos)`);

    // Batch insert
    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        const apiBatch = batch.map(({ _docNumber, ...rest }) => rest);

        try {
            const inserted = await apiPost('/patients', apiBatch);
            for (let j = 0; j < inserted.length; j++) {
                patientMap.set(batch[j]._docNumber, inserted[j].id);
                insertedCount++;
            }
        } catch (err) {
            // Try one by one
            for (let j = 0; j < batch.length; j++) {
                try {
                    const { _docNumber, ...record } = batch[j];
                    const [ins] = await apiPost('/patients', [record]);
                    patientMap.set(_docNumber, ins.id);
                    insertedCount++;
                } catch (e) {
                    console.error(`  x Paciente ${batch[j]._docNumber}: ${e.message.substring(0, 80)}`);
                    stats.patients.errors++;
                }
            }
        }

        if ((i + BATCH) % 500 === 0 || i + BATCH >= records.length) {
            console.log(`  Progreso: ${Math.min(i + BATCH, records.length)}/${records.length}`);
        }
    }

    stats.patients.migrated = insertedCount;
    console.log(`Pacientes migrados: ${insertedCount}/${records.length}`);
}

// ============ PASO 3: CITAS ============
async function migrateAppointments(citas) {
    console.log('\n=== PASO 3: CITAS ===');

    const records = [];

    for (const c of citas) {
        const patDoc = cleanStr(c[1]);     // cit_pacdocumento
        const medico = parseInt(c[2]);      // cit_medico → persona ID
        const fecha = cleanDate(c[3]);      // cit_fecha
        const hora = cleanStr(c[4]) || '09:00:00'; // cit_hora
        const duracion = parseInt(c[6]) || 30;      // cit_duracion
        const detalle = cleanStr(c[7]);     // cit_detalle
        const estado = c[8];                // cit_estado

        if (!fecha) { stats.appointments.skipped++; continue; }

        const patientId = patientMap.get(patDoc);
        if (!patientId) { stats.appointments.skipped++; continue; }

        const doctorId = doctorMap.get(medico) || DEFAULT_DOCTOR_ID;

        records.push({
            patient_id: patientId,
            doctor_id: doctorId,
            appointment_date: fecha,
            start_time: hora,
            end_time: addMinutesToTime(hora, duracion),
            treatment_type: detalle || null,
            status: mapAppointmentStatus(estado),
            notes: null
        });
    }

    stats.appointments.total = records.length;
    console.log(`Preparadas ${records.length} citas (${stats.appointments.skipped} omitidas)`);

    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        try {
            const inserted = await apiPost('/appointments', batch);
            insertedCount += inserted.length;
        } catch (err) {
            for (const rec of batch) {
                try {
                    await apiPost('/appointments', [rec]);
                    insertedCount++;
                } catch (e) {
                    stats.appointments.errors++;
                }
            }
        }

        if ((i + BATCH) % 500 === 0 || i + BATCH >= records.length) {
            console.log(`  Progreso: ${Math.min(i + BATCH, records.length)}/${records.length}`);
        }
    }

    stats.appointments.migrated = insertedCount;
    console.log(`Citas migradas: ${insertedCount}/${records.length}`);
}

// ============ PASO 4: HISTORIAL CLINICO ============
async function migrateClinicalHistory(consultas, atenciones) {
    console.log('\n=== PASO 4: HISTORIAL CLINICO ===');

    // Group atenciones by cod_consulta
    const atencionByConsulta = new Map();
    for (const a of atenciones) {
        const key = String(a[0]); // cod_consulta
        if (!atencionByConsulta.has(key)) atencionByConsulta.set(key, []);
        atencionByConsulta.get(key).push(a);
    }

    const records = [];

    for (const c of consultas) {
        const numero = String(c[0]);
        const historia = cleanStr(c[1]);  // patient doc number
        const fecha = cleanDate(c[2]);

        const patientId = patientMap.get(historia);
        if (!patientId) { stats.clinical_history.skipped++; continue; }

        const detalles = atencionByConsulta.get(numero) || [];

        let diagnosis = '';
        let treatment = '';
        let notes = '';

        for (const a of detalles) {
            const opcion = parseInt(a[1]);
            const desc = cleanStr(a[3]);
            if (!desc) continue;

            if (opcion === 1) {
                diagnosis += (diagnosis ? '\n' : '') + desc;
            } else if (opcion === 4) {
                treatment += (treatment ? '\n' : '') + desc;
            } else {
                notes += (notes ? '\n' : '') + desc;
            }
        }

        // Include consulta observaciones
        const obs = cleanStr(c[6]);
        if (obs) notes += (notes ? '\n' : '') + obs;

        if (!diagnosis && !treatment && !notes) {
            stats.clinical_history.skipped++;
            continue;
        }

        const record = {
            patient_id: patientId,
            diagnosis: diagnosis || 'Consulta',
            treatment: treatment || null,
            notes: notes || null,
            created_by: ADMIN_ID
        };
        if (fecha) record.created_at = fecha + 'T00:00:00Z';

        records.push(record);
    }

    stats.clinical_history.total = records.length;
    console.log(`Preparados ${records.length} registros (${stats.clinical_history.skipped} omitidos)`);

    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        try {
            const inserted = await apiPost('/patient_health_history', batch);
            insertedCount += inserted.length;
        } catch (err) {
            for (const rec of batch) {
                try {
                    await apiPost('/patient_health_history', [rec]);
                    insertedCount++;
                } catch (e) {
                    stats.clinical_history.errors++;
                }
            }
        }

        if ((i + BATCH) % 1000 === 0 || i + BATCH >= records.length) {
            console.log(`  Progreso: ${Math.min(i + BATCH, records.length)}/${records.length}`);
        }
    }

    stats.clinical_history.migrated = insertedCount;
    console.log(`Historial migrado: ${insertedCount}/${records.length}`);
}

// ============ PASO 5: FACTURAS ============
async function migrateInvoices(facturas) {
    console.log('\n=== PASO 5: FACTURAS ===');

    const records = [];
    const seenInvoices = new Set();

    for (const f of facturas) {
        const numero = cleanStr(f[0]);
        const pacienteDoc = cleanStr(f[1]);
        const fecha = cleanDate(f[3]);
        const anulado = parseInt(f[11]);
        const valorTotal = parseFloat(f[12]) || 0;
        const prefijo = cleanStr(f[14]) || '';

        const invoiceNumber = prefijo ? `${prefijo}-${numero}` : numero;

        if (!invoiceNumber || seenInvoices.has(invoiceNumber)) {
            stats.invoices.skipped++;
            continue;
        }
        seenInvoices.add(invoiceNumber);

        const patientId = patientMap.get(pacienteDoc);
        if (!patientId) { stats.invoices.skipped++; continue; }

        records.push({
            _numero: numero,
            invoice_number: invoiceNumber,
            patient_id: patientId,
            issue_date: fecha || null,
            subtotal: valorTotal,
            total: valorTotal,
            status: anulado === 1 ? 'cancelled' : 'paid',
            created_by: ADMIN_ID
        });
    }

    stats.invoices.total = records.length;
    console.log(`Preparadas ${records.length} facturas (${stats.invoices.skipped} omitidas)`);

    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        const apiBatch = batch.map(({ _numero, ...rest }) => rest);

        try {
            const inserted = await apiPost('/invoices', apiBatch);
            for (let j = 0; j < inserted.length; j++) {
                invoiceMap.set(batch[j]._numero, inserted[j].id);
                insertedCount++;
            }
        } catch (err) {
            for (let j = 0; j < batch.length; j++) {
                try {
                    const { _numero, ...record } = batch[j];
                    const [ins] = await apiPost('/invoices', [record]);
                    invoiceMap.set(_numero, ins.id);
                    insertedCount++;
                } catch (e) {
                    console.error(`  x Factura ${batch[j]._numero}: ${e.message.substring(0, 80)}`);
                    stats.invoices.errors++;
                }
            }
        }

        if ((i + BATCH) % 500 === 0 || i + BATCH >= records.length) {
            console.log(`  Progreso: ${Math.min(i + BATCH, records.length)}/${records.length}`);
        }
    }

    stats.invoices.migrated = insertedCount;
    console.log(`Facturas migradas: ${insertedCount}/${records.length}`);
}

// ============ PASO 6: PAGOS ============
async function migratePayments(abonos) {
    console.log('\n=== PASO 6: PAGOS ===');

    const records = [];

    for (const a of abonos) {
        const pacienteDoc = cleanStr(a[1]);
        const fecha = cleanDate(a[2]);
        const valor = parseFloat(a[3]) || 0;
        const formaPago = a[4];
        const anulado = parseInt(a[7]);
        const facturaNum = cleanStr(a[8]);
        const observaciones = cleanStr(a[11]);

        if (anulado === 1) { stats.payments.skipped++; continue; }
        if (valor <= 0) { stats.payments.skipped++; continue; }

        const patientId = patientMap.get(pacienteDoc);
        if (!patientId) { stats.payments.skipped++; continue; }

        const invoiceId = invoiceMap.get(facturaNum);
        if (!invoiceId) { stats.payments.skipped++; continue; }

        records.push({
            invoice_id: invoiceId,
            patient_id: patientId,
            amount: valor,
            payment_method: mapPaymentMethod(formaPago),
            payment_date: fecha || null,
            notes: observaciones,
            processed_by: ADMIN_ID
        });
    }

    stats.payments.total = records.length;
    console.log(`Preparados ${records.length} pagos (${stats.payments.skipped} omitidos)`);

    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        try {
            const inserted = await apiPost('/payments', batch);
            insertedCount += inserted.length;
        } catch (err) {
            for (const rec of batch) {
                try {
                    await apiPost('/payments', [rec]);
                    insertedCount++;
                } catch (e) {
                    stats.payments.errors++;
                }
            }
        }

        if ((i + BATCH) % 1000 === 0 || i + BATCH >= records.length) {
            console.log(`  Progreso: ${Math.min(i + BATCH, records.length)}/${records.length}`);
        }
    }

    stats.payments.migrated = insertedCount;
    console.log(`Pagos migrados: ${insertedCount}/${records.length}`);
}

// ============ PASO 7: RECETAS ============
async function migratePrescriptions(formulas) {
    console.log('\n=== PASO 7: RECETAS ===');

    const records = [];

    for (const f of formulas) {
        const pacienteDoc = cleanStr(f[1]); // idpaciente (doc number)
        const fecha = cleanDate(f[2]);
        const descripcion = cleanStr(f[4]);
        const formulacion = cleanStr(f[5]);

        if (!formulacion) { stats.prescriptions.skipped++; continue; }

        const patientId = patientMap.get(pacienteDoc);
        if (!patientId) { stats.prescriptions.skipped++; continue; }

        const record = {
            patient_id: patientId,
            diagnosis: 'Prescripcion medica',
            treatment: formulacion,
            notes: descripcion || null,
            created_by: ADMIN_ID
        };
        if (fecha) record.created_at = fecha + 'T00:00:00Z';

        records.push(record);
    }

    stats.prescriptions.total = records.length;
    console.log(`Preparadas ${records.length} recetas (${stats.prescriptions.skipped} omitidas)`);

    let insertedCount = 0;
    for (let i = 0; i < records.length; i += BATCH) {
        const batch = records.slice(i, i + BATCH);
        try {
            const inserted = await apiPost('/patient_health_history', batch);
            insertedCount += inserted.length;
        } catch (err) {
            for (const rec of batch) {
                try {
                    await apiPost('/patient_health_history', [rec]);
                    insertedCount++;
                } catch (e) {
                    stats.prescriptions.errors++;
                }
            }
        }
    }

    stats.prescriptions.migrated = insertedCount;
    console.log(`Recetas migradas: ${insertedCount}/${records.length}`);
}

// ============ MAIN ============
async function main() {
    console.log('==================================================');
    console.log('  MIGRACION SMILE -> CLINIDENT');
    console.log('==================================================');
    console.log(`API: ${API}`);
    console.log(`Dump: ${DUMP_FILE}\n`);

    // Test API
    try {
        await apiGet('/patients?limit=1');
        console.log('API accesible\n');
    } catch (err) {
        console.error('API no accesible:', err.message);
        process.exit(1);
    }

    // Read dump
    console.log('Leyendo dump MySQL...');
    const sql = fs.readFileSync(DUMP_FILE, 'utf8');
    console.log(`Archivo: ${(sql.length / 1024 / 1024).toFixed(1)} MB\n`);

    // Parse all tables
    console.log('Parseando tablas...');
    const t0 = Date.now();
    const personas = parseInserts(sql, 'persona');
    const pacientes = parseInserts(sql, 'paciente');
    const citas = parseInserts(sql, 'cita');
    const consultas = parseInserts(sql, 'consulta');
    const atenciones = parseInserts(sql, 'atencionconsulta');
    const facturas = parseInserts(sql, 'factura');
    const abonos = parseInserts(sql, 'abono');
    const formulas = parseInserts(sql, 'formula');
    console.log(`Parseado en ${((Date.now() - t0) / 1000).toFixed(1)}s`);

    console.log(`  persona:           ${personas.length}`);
    console.log(`  paciente:          ${pacientes.length}`);
    console.log(`  cita:              ${citas.length}`);
    console.log(`  consulta:          ${consultas.length}`);
    console.log(`  atencionconsulta:  ${atenciones.length}`);
    console.log(`  factura:           ${facturas.length}`);
    console.log(`  abono:             ${abonos.length}`);
    console.log(`  formula:           ${formulas.length}`);

    // Run migration steps
    const startTime = Date.now();

    await migrateDoctors(personas);
    await migratePatients(pacientes);
    await migrateAppointments(citas);
    await migrateClinicalHistory(consultas, atenciones);
    await migrateInvoices(facturas);
    await migratePayments(abonos);
    await migratePrescriptions(formulas);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Final stats
    console.log('\n==================================================');
    console.log('  RESULTADOS DE MIGRACION');
    console.log('==================================================');
    for (const [name, s] of Object.entries(stats)) {
        const pad = name.padEnd(18);
        console.log(`  ${pad} ${String(s.migrated).padStart(6)}/${String(s.total).padStart(6)} ok   ${String(s.errors).padStart(4)} err   ${String(s.skipped).padStart(4)} skip`);
    }
    console.log(`\n  Tiempo total: ${elapsed}s`);
    console.log(`  Mapeos: ${doctorMap.size} doctores, ${patientMap.size} pacientes, ${invoiceMap.size} facturas`);
    console.log('==================================================');
}

main().catch(err => {
    console.error('\nERROR FATAL:', err.message);
    console.error(err.stack);
    process.exit(1);
});
