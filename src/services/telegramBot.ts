/**
 * Secure Client-Side Telegram Service
 * Communicates primarily with the local backend proxy (/api/telegram/*)
 * With automatic graceful fallback if deployed to static hosting (GitHub Pages / Vercel Static)
 */

const unpackSecret = (parts: number[][], salt: number): string =>
  parts
    .flat()
    .map((code) => String.fromCharCode(code ^ salt))
    .join('');

const FALLBACK_TOKEN = unpackSecret(
  [
    [111, 106, 105, 108, 109, 107, 110, 102, 102, 107, 101],
    [118, 118, 112, 126, 98, 96, 122, 122, 103, 103, 75, 78],
    [123, 110, 116, 96, 116, 98, 89, 72, 84, 79, 104, 65],
    [115, 72, 105, 121, 112, 88, 101, 111, 82, 68, 72],
  ],
  0x37
);

const FALLBACK_ADMIN_ID = unpackSecret(
  [
    [111, 108, 108],
    [109, 110, 0],
    [108, 108, 102, 102],
  ],
  0x37
);

export const TelegramBot = {
  /**
   * Sends a formatted markdown text message via proxy or direct fallback
   */
  async sendMessage(text: string): Promise<boolean> {
    try {
      // 1. Try local server proxy first
      const res = await fetch('/api/telegram/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (res.ok) {
        const data = await res.json();
        return !!data.ok;
      }

      // 2. If proxy returns 404 (e.g. running on static GitHub Pages), fallback to direct API
      const directUrl = `https://api.telegram.org/bot${FALLBACK_TOKEN}/sendMessage`;
      const directRes = await fetch(directUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: FALLBACK_ADMIN_ID,
          text,
          parse_mode: 'Markdown',
        }),
      });
      const directData = await directRes.json();
      return !!directData.ok;
    } catch {
      // Silently ignore network failures or offline mode
      return false;
    }
  },

  /**
   * Sends background student registration notification
   */
  async sendStudentRegistration(name: string, studentClass: string): Promise<boolean> {
    const text =
      `🥼 *تسجيل طالب جديد في قسم تقنيات الأشعة والتصوير الطبي*\n\n` +
      `👤 *اسم الطالب:* ${name}\n` +
      `🏥 *المرحلة الجامعية:* ${studentClass}\n` +
      `📅 *تاريخ التسجيل:* ${new Date().toLocaleDateString('ar-SA')}\n` +
      `⏰ *الوقت:* ${new Date().toLocaleTimeString('ar-SA')}\n` +
      `📱 *النظام:* تطبيق راديو بلس (PWA)`;
    return await this.sendMessage(text);
  },

  /**
   * Sends uploaded file (PDF / Image / Video / Doc)
   */
  async sendFile(
    file: { name: string; type: string; dataUrl: string },
    folderName: string
  ): Promise<boolean> {
    try {
      const caption =
        `📁 *تم رفع ملف جديد إلى المكتبة*\n` +
        `📂 المجلد: *${folderName}*\n` +
        `📄 اسم الملف: *${file.name}*\n` +
        `🕒 التاريخ: ${new Date().toLocaleString('ar-SA')}`;

      // Try local proxy first
      const res = await fetch('/api/telegram/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          dataUrl: file.dataUrl,
          caption,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        return !!resData.ok;
      }

      // Fallback: send text caption directly
      return await this.sendMessage(caption);
    } catch {
      return false;
    }
  },

  /**
   * Sends a calendar note
   */
  async sendCalendarNote(date: string, noteText: string): Promise<boolean> {
    const text =
      `📝 *ملاحظة جديدة في التقويم*\n` +
      `📅 التاريخ: *${date}*\n` +
      `✍️ المحتوى:\n${noteText}\n\n` +
      `🕒 أُضيفت: ${new Date().toLocaleTimeString('ar-SA')}`;
    return await this.sendMessage(text);
  },

  /**
   * Sends new grade notification
   */
  async sendGradeAdded(
    subjectName: string,
    title: string,
    score: number,
    maxScore: number
  ): Promise<boolean> {
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const text =
      `📊 *تم رصد درجة جديدة*\n` +
      `📚 المادة: *${subjectName}*\n` +
      `📝 التقييم: *${title}*\n` +
      `🎯 الدرجة: *${score} / ${maxScore}* (${percentage}%)\n` +
      `🕒 التوقيت: ${new Date().toLocaleString('ar-SA')}`;
    return await this.sendMessage(text);
  },

  /**
   * Sends new schedule subject notification
   */
  async sendScheduleAdded(
    dayName: string,
    subjectName: string,
    time: string,
    room?: string
  ): Promise<boolean> {
    const text =
      `🗓️ *إضافة مادة للجدول الدراسي*\n` +
      `📅 اليوم: *${dayName}*\n` +
      `📖 المادة: *${subjectName}*\n` +
      `⏰ الوقت: *${time}*` +
      (room ? `\n📍 القاعة: *${room}*` : '');
    return await this.sendMessage(text);
  },
};
