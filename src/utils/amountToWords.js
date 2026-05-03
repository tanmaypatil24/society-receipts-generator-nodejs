const ones = ["", "One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
const tens = ["", "", "Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

function twoDigit(n){
  if(n<20) return ones[n];
  const t = Math.floor(n/10);
  const o = n%10;
  return tens[t] + (o? " " + ones[o] : "");
}

function numberToWords(n){
  if(n===0) return "Zero";
  let result = "";
  if(n >= 10000000){
    result += numberToWords(Math.floor(n/10000000)) + " Crore ";
    n = n % 10000000;
  }
  if(n >= 100000){
    result += numberToWords(Math.floor(n/100000)) + " Lakh ";
    n = n % 100000;
  }
  if(n >= 1000){
    result += numberToWords(Math.floor(n/1000)) + " Thousand ";
    n = n % 1000;
  }
  if(n >= 100){
    result += ones[Math.floor(n/100)] + " Hundred ";
    n = n % 100;
  }
  if(n > 0){
    if(result !== "") result += "and ";
    result += twoDigit(n) + " ";
  }
  return result.trim();
}

export function amountToWords(amount){
  // amount: number or numeric string (e.g., 2500.50)
  const value = Number(amount);
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  const rupeesWords = numberToWords(rupees) + (rupees ? " Rupees" : "");
  const paiseWords = paise ? (" and " + numberToWords(paise) + " Paise") : "";
  return (rupeesWords + paiseWords + " Only").trim();
}
