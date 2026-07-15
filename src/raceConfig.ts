// 目標賽事：使用者提供的真實資訊，非推算值
export const TARGET_RACE = {
  name: '金澤全程馬拉松',
  date: '2026-10-25',
  goalLabel: 'Sub 4:00',
};

export function daysUntilRace(): number {
  const raceDate = new Date(`${TARGET_RACE.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((raceDate.getTime() - today.getTime()) / 86400000);
}
