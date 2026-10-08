/**
 * Secure Client-Side Telegram Service
 * Communicates strictly with the local backend proxy (/api/telegram/*)
 * No tokens or chat IDs are exposed in the browser bundle.
 */

export const TelegramBot = {
  /**
   * Sends a formatted markdown text message via the secure server proxy
   */
  async sendMessage(text: string): Promise<boolean> {
    try {
      const res = await fetch('/api/telegram/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      return !!data.ok;
    } catch {
      // Silently ignore when offline
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
   * Sends uploaded file (PDF / Image / Video / Doc) via the secure server proxy
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

      const res = await fetch('/api/telegram/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          dataUrl: file.dataUrl,
          caption,
        }),
      });
      const resData = await res.json();
      return !!resData.ok;
    } catch {
      return false;
    }
  },

  /**
   * Sends a calendar note via the secure server proxy
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
   * Sends new grade notification via the secure server proxy
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
   * Sends new schedule subject notification via the secure server proxy
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
