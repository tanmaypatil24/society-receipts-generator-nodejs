export async function fetchReceiptsByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const receipts = await receipts.findAll({
    where: {
      id: ids,
    },
  });

  return receipts.map((r) => r.toJSON());
}
