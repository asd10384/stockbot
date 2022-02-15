import "dotenv/config";

export const cooldown: Map<string, number> = new Map();
export const cooldowntime: number = parseInt(process.env.COOLDOWNTIME!) || 30;

export function setcooldown(text: string) {
  cooldown.set(text, Date.now()+cooldowntime*60*1000);
}