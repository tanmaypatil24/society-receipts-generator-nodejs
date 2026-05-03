import { 
  createReceiptService, 
  getReceiptByIdService, 
  listReceiptsService, 
  updateReceiptService 
} from "../services/receipt.service.js";


export async function createReceiptHandler(req, res) {
  console.log("REQUEST BODY:", req.body);
  try {
    const {
      member_id,
      amount,
      amount_in_words,
      flat_no,
      wing,
      for_month,
      payment_mode,
      cheque_no,
      bank_name,
      payment_date,
    } = req.body;

    // VALIDATION RULES
    if (!member_id || !amount || !for_month ) {
      return res.status(400).json({
        error: "member_id, amount, for_month, payment_date are required",
      });
    }

    // if (payment_mode === "Cheque" && !cheque_no) {
    //   return res.status(400).json({ error: "Cheque number required for cheque payments" });
    // }

    if (amount <= 0) {
      return res.status(400).json({ error: "Amount must be greater than 0" });
    }

    const result = await createReceiptService(req.body);
    return res.status(201).json(result);

  } catch (err) {
    console.error("Create Receipt Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getReceiptHandler(req, res) {
  try {
    const id = req.params.id;
    const receipt = await getReceiptByIdService(id);
    
    if (!receipt) return res.status(404).json({ error: "Receipt Not Found" });

    return res.json(receipt);

  } catch (err) {
    console.error("Get Receipt Error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function listReceiptsHandler(req, res) {
  try {
    const list = await listReceiptsService(200);
    return res.json(list);
  } catch (err) {
    console.error("List Error:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateReceiptHandler(req, res) {
  try {
    const id = req.params.id;

    const existing = await getReceiptByIdService(id);
    if (!existing) {
      return res.status(404).json({ error: "Receipt not found" });
    }

    const result = await updateReceiptService(id, req.body);
    return res.json({ message: "Receipt updated successfully", updated: result });

  } catch (err) {
    console.error("Update Receipt Error:", err);
    return res.status(500).json({ error: err.message });
  }
}
