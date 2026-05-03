export function receiptTemplateWithCopy(data, copyType = "") {
  const receiptNo = data.receipt_no || "NA";
  const createdAt = data.created_at
    ? new Date(data.created_at).toLocaleDateString()
    : "";
  const paymentDate = data.payment_date
    ? new Date(data.payment_date).toLocaleDateString()
    : "";
  const memberName = data.member_name || data.name || "";
  const flatNo = data.member_flat || data.flat_no || "";
  const wing = data.member_wing || data.wing || "";
  const amount = Number(data.amount).toFixed(2);
  const amount_in_words = data.amount_in_words || "";
  const cheque_no = data.cheque_no || "";
  const for_month = data.for_month || "";
  const payment_mode = data.payment_mode || "";
  const branch = data.branch || "";
  const bank_name = data.bank_name || "";
  const reference_no = data.maintenance_reference_no || "";

  return `
  <div class="receipt-root">
    <div class="paper">
        <div class="header">
          <div class="title">${data?.society_name}</div>
          <div class="reg">Reg. No.: ${data?.society_registration_no}</div>
          <div class="addr">
            ${data?.society_address}
          </div>
        </div>

        <div class="receipt-badge"><span>RECEIPT</span></div>

        <div class="row top-row">
          <div class="label">Receipt No. :</div>
          <div class="line short">${receiptNo}</div>
          <div class="spacer"></div>
          <div class="label">Receipt Date :</div>
          <div class="line short">${createdAt}</div>
        </div>

        <div class="row">
          <div class="label wide">Received with thanks from</div>
          <div class="line fill">${memberName}</div>
        </div>

        <div class="row">
          <div style="display: flex; align-items: center">
            <div class="label">Rs.</div>
            <div class="line fill short-rupees">
              ₹ ${amount}
            </div>
          </div>
          <div style="display: flex; align-items: center; width: 100%">
            <div class="label">Rupees In Words</div>
            <div class="line fill">${amount_in_words}</div>
          </div>
        </div>

        <div class="row">
          <div class="label muted">In Cash / NEFT / Cheque No.</div>
          <div class="line short">${cheque_no}</div>
          <div class="label muted">Date</div>
          <div class="line short">${paymentDate}</div>
        </div>

        <div class="row">
          <div class="label">Drawn on Bank</div>
          <div class="line fill">${bank_name}</div>
          <div class="label">Payment Mode</div>
          <div class="line fill">${payment_mode}</div>
        </div>

        <div class="row">
          <div class="label">towards the payment of</div>
          <div class="line fill">Maintenance Charges (Reference: ${reference_no})</div>
        </div>

        <div class="row">
          <div class="label">Flat / Shop No.</div>
          <div class="line short">${wing ? wing + " - " : ""}${flatNo}</div>
          <div class="label">For the month of</div>
          <div class="line short">${for_month}</div>
        </div>

        <div class="row">
          <div class="amount-row">
            <div class="amount-area">
              <div class="rupee-box">₹</div>
              <div class="amount-box">${amount}</div>
            </div>
            <div class="note">
              This receipt is valid subject to realisation of cheque.
            </div>
          </div>

          <div class="footer">
            <div class="for-company"></div>

            <div class="signs">
              <div class="sig_bottom">Receiver's Signature</div>
            </div>
          </div>
        </div>
      </div>
  </div>
  `;
}
