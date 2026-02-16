const SBERBANK_PAYMENT_PREFIX = "SBER";

function crc16Like(payload: string): string {
  let checksum = 0;
  for (let i = 0; i < payload.length; i += 1) {
    checksum = (checksum + payload.charCodeAt(i) * (i + 1)) % 10_000;
  }

  return checksum.toString().padStart(4, "0");
}

export function createSberbankPaymentCode(totalRub: number): string {
  const safeTotalRub = Number.isFinite(totalRub) ? Math.max(0, totalRub) : 0;
  const amountKopeks = Math.round(safeTotalRub * 100);
  const payload = `${SBERBANK_PAYMENT_PREFIX}|TAGIL_PIZZA|${amountKopeks}`;
  const checksum = crc16Like(payload);

  return `${payload}|${checksum}`;
}

