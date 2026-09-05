export function calcLevel(totalDays: number): number { return Math.max(1, Math.floor(totalDays / 10) + 1); }
export function getLevelTitle(level: number): string { if (level >= 10) return '签到之神'; if (level >= 7) return '签到达人'; if (level >= 4) return '活跃签到员'; return '新手签到员'; }
export function getLevelColor(level: number): string { if (level >= 10) return 'text-orange-500'; if (level >= 7) return 'text-purple-600'; if (level >= 4) return 'text-blue-500'; return 'text-gray-500'; }
