import { pool } from "../config/db.js";

export async function createMember(req, res) {
  try {
    const { members } = req.body;

    if (!Array.isArray(members) || members.length === 0) {
      return res
        .status(400)
        .json({ error: "Members must be a non-empty array" });
    }

    const insertData = [];
    for (const m of members) {
      if (!m.name || !m.flat_no || !m.wing) {
        return res.status(422).json({
          error: "Each member must include name, flat_no & wing",
        });
      }
      insertData.push([m.name, m.flat_no, m.wing, m.phone || null]);
    }

    await pool.query(
      `INSERT INTO members (name, flat_no, wing, phone) VALUES ?`,
      [insertData]
    );

    res.status(201).json({
      message: "Members inserted successfully",
      count: insertData.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateMember(req, res) {
  try {
    const memberId = req.params.id;
    const { name, flat_no, wing, phone } = req.body;

    // // Validation: Check if another member already exists with same Flat + Wing
    // const [existing] = await pool.query(
    //   `SELECT * FROM members WHERE flat_no = ? AND wing = ? AND id != ? LIMIT 1`,
    //   [flat_no, wing, memberId]
    // );

    // if (existing.length > 0) {
    //   return res.status(409).json({
    //     error: "Flat & Wing combination already exists for another member"
    //   });
    // }

    // Perform update
    await pool.query(
      `UPDATE members SET name = ?, flat_no = ?, wing = ?, phone = ? WHERE id = ?`,
      [name, flat_no, wing, phone || null, memberId]
    );

    // Fetch updated record
    const [rows] = await pool.query("SELECT * FROM members WHERE id = ?", [
      memberId,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function listMembers(req, res) {
  try {
    const [rows] = await pool.query("SELECT * FROM members ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
