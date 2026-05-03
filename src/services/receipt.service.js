// src/services/receipt.service.js
import { pool } from "../config/db.js";
import { amountToWords } from "../utils/amountToWords.js";

/**
 * Create service names expected by controller:
 * - createReceiptService
 * - getReceiptByIdService
 * - listReceiptsService
 * - updateReceiptService
 */

/** Compute next sequence for current month/year (atomic enough for small scale).
 *  For high concurrency use a separate sequence table / DB-side transaction with SELECT ... FOR UPDATE.
 */
async function _getNextReceiptSeq(conn) {
  // count receipts for current year & month
  const [rows] = await conn.query(
    `SELECT COUNT(*) as cnt FROM receipts WHERE YEAR(created_at)=YEAR(CURRENT_DATE) AND MONTH(created_at)=MONTH(CURRENT_DATE)`
  );
  const cnt = rows[0]?.cnt ?? 0;
  return cnt + 1;
}

/** Format receipt number */
// function _formatReceiptNo(year, month, seq) {
//   const seqPadded = String(seq).padStart(5, "0");
//   return `SYHS/${year}/${month}/${seqPadded}`;
// }

function _formatReceiptNo(year, month, seq) {
  // Convert full year (2025) into short financial year (25-26)
  const yy = year.toString().slice(-2);          // "25"
  const nextYy = (Number(yy) + 1).toString().padStart(2, "0"); // "26"
  const finYear = `${yy}-${nextYy}`;

  const seqPadded = String(seq).padStart(3, "0"); // 3 digits

  return `SYHS/MR/${finYear}/${month}/${seqPadded}`;
}


/** Create receipt service */
export async function createReceiptService(payload) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Basic validation: member exists?
    const [mRows] = await conn.query("SELECT id, name, flat_no, wing FROM members WHERE id = ? LIMIT 1", [payload.member_id]);
    console.log([mRows]);
    if (!mRows.length) {
      throw new Error("Member not found");
    }

    if (!payload.amount || Number(payload.amount) <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (!payload.for_month || !payload.payment_date || !payload.payment_mode) {
      throw new Error("for_month, payment_date and payment_mode are required");
    }

    if (payload.payment_mode === "Cheque" && !payload.cheque_no) {
      throw new Error("cheque_no is required for Cheque payments");
    }

    // compute seq and receipt_no
    const seq = await _getNextReceiptSeq(conn);
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    const receipt_no = _formatReceiptNo(year, month, seq);

    // amount_in_words if not provided
    const amountInWords = payload.amount_in_words || amountToWords(payload.amount);

    const insertSql = `
      INSERT INTO receipts
      (receipt_no, receipt_seq, member_id, amount, amount_in_words, for_month, payment_mode, cheque_no, bank_name, payment_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      receipt_no,
      seq,
      payload.member_id,
      payload.amount,
      amountInWords,
      payload.for_month,
      payload.payment_mode,
      payload.cheque_no || null,
      payload.bank_name || null,
      payload.payment_date,
    ];

    const [result] = await conn.query(insertSql, params);

    await conn.commit();

    // return joined receipt + member info
    const [rowsAfter] = await pool.query(
      `SELECT r.*, m.name AS member_name, m.flat_no AS member_flat, m.wing AS member_wing
       FROM receipts r
       JOIN members m ON r.member_id = m.id
       WHERE r.id = ? LIMIT 1`, [result.insertId]
    );

    return rowsAfter[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Fetch single receipt (joined with member) */
export async function getReceiptByIdService(id) {
  const [rows] = await pool.query(
    `SELECT r.*, m.name AS member_name, m.flat_no AS member_flat, m.wing AS member_wing
     FROM receipts r
     JOIN members m ON r.member_id = m.id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

/** List receipts (joined) */
export async function listReceiptsService(limit = 50) {
  const [rows] = await pool.query(
    `SELECT r.*, m.name AS member_name, m.flat_no AS member_flat, m.wing AS member_wing
     FROM receipts r
     JOIN members m ON r.member_id = m.id
     ORDER BY r.created_at DESC
     LIMIT ?`,
    [Number(limit)]
  );
  return rows;
}

/** Update receipt service
 * - Does NOT change receipt_no or receipt_seq
 * - Validates existence and necessary fields
 */
export async function updateReceiptService(id, payload) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // fetch existing
    const [existingRows] = await conn.query("SELECT * FROM receipts WHERE id = ? LIMIT 1", [id]);
    if (!existingRows.length) {
      throw new Error("Receipt not found");
    }
    const existing = existingRows[0];

    // Validate fields if provided
    if (payload.amount !== undefined && Number(payload.amount) <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    if (payload.payment_mode && payload.payment_mode === "Cheque" && !payload.cheque_no && !existing.cheque_no && !payload.cheque_no) {
      throw new Error("cheque_no is required when payment_mode is Cheque");
    }

    // If member_id is being changed, ensure member exists
    if (payload.member_id && payload.member_id !== existing.member_id) {
      const [mRows] = await conn.query("SELECT id FROM members WHERE id = ? LIMIT 1", [payload.member_id]);
      if (!mRows.length) throw new Error("New member_id not found");
    }

    // Build update dynamic
    const fields = [];
    const params = [];

    const allowed = ["member_id","amount","amount_in_words","for_month","payment_mode","cheque_no","bank_name","payment_date"];
    for (const key of allowed) {
      if (payload[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(payload[key]);
      }
    }

    if (fields.length === 0) {
      throw new Error("No updatable fields provided");
    }

    params.push(id);
    const sql = `UPDATE receipts SET ${fields.join(", ")} WHERE id = ?`;
    await conn.query(sql, params);

    await conn.commit();

    // return updated joined row
    const [rowsAfter] = await pool.query(
      `SELECT r.*, m.name AS member_name, m.flat_no AS member_flat, m.wing AS member_wing
       FROM receipts r
       JOIN members m ON r.member_id = m.id
       WHERE r.id = ? LIMIT 1`, [id]
    );
    return rowsAfter[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
