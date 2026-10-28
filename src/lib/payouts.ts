import { getClub } from "../data/clubs";
import { payoutAmount } from "./pricing";
import type { Club, PayoutMethod } from "./types";

export interface PayoutOption {
  method: PayoutMethod;
  amount: number;
  club?: Club;
}

/**
 * Club credit is in the shop of the club whose shirt it is, and only if that club is a partner.
 * Otherwise the seller chooses between their Locker balance and cash. The favourite club doesn't matter here.
 */
export function payoutOptions(price: number, shirtClubId: string): PayoutOption[] {
  const club = getClub(shirtClubId)!;
  return [
    ...(club.partner ? [{ method: "club_credit" as const, amount: payoutAmount(price, "club_credit"), club }] : []),
    { method: "locker_balance", amount: payoutAmount(price, "locker_balance") },
    { method: "bank", amount: payoutAmount(price, "bank") },
  ];
}
