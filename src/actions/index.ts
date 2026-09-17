import { defineAction, ActionError } from 'astro:actions';
import { Resend } from 'resend';

function buildEmailBody(payload: Record<string, unknown>): string {
  const lines: string[] = [];
  const labels: Record<string, string> = {
    formSource: 'Nguồn form',
    jmeno: 'Họ tên',
    telefon: 'Điện thoại',
    phone: 'Điện thoại',
    email: 'E-mail',
    vzkaz: 'Tin nhắn',
    userType: 'Tôi là',
    selectedService: 'Tôi quan tâm đến',
    hlavni_volba: 'Lựa chọn dịch vụ chính',
    marketing_balicek: 'Gói marketing',
    typ_nemovitosti: 'Loại bất động sản',
    dispozice: 'Bố cục',
    stav: 'Tình trạng',
    lokalita: 'Khu vực',
    termin: 'Thời điểm bán',
    odkaz: 'Liên kết tài liệu',
    souhlas: 'Đồng ý',
  };
  const formLabels: Record<string, string> = {
    contact: 'Form liên hệ',
    meeting: 'Đặt lịch gặp',
    newsletter: 'Newsletter – đăng ký nhận tin',
    callback: 'Để lại liên hệ – chúng tôi sẽ gọi lại',
  };
  const formSourceLabel = formLabels[String(payload.formSource ?? '')] ?? 'Form từ website';
  lines.push(`Form: ${formSourceLabel}`);
  lines.push('');
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'formSource' || value === undefined || value === null || value === '') continue;
    const label = labels[key] ?? key;
    lines.push(`${label}: ${String(value).trim()}`);
  }
  return lines.join('\n');
}

export const server = {
  sendContactForm: defineAction({
    accept: 'json',
    handler: async (input: Record<string, unknown>) => {
      const formSource = String(input?.formSource ?? '').trim();
      const jmeno = String(input?.jmeno ?? '').trim();
      const telefon = String(input?.telefon ?? '').trim();
      const email = String(input?.email ?? '').trim();
      const phone = String(input?.phone ?? '').trim();
      if (formSource === 'newsletter') {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Vui lòng nhập e-mail hợp lệ.' });
        }
      } else if (formSource === 'callback') {
        const p = phone.replace(/\s/g, '');
        if (p.length < 9 || !/^[0-9+]/.test(p)) {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Vui lòng nhập số điện thoại hợp lệ.' });
        }
      } else if (!jmeno || !telefon || !email) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Vui lòng điền họ tên, điện thoại và e-mail.',
        });
      }
      const apiKey = import.meta.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Thiếu cấu hình e-mail (RESEND_API_KEY).',
        });
      }
      const body = buildEmailBody(input as Record<string, unknown>);
      const resend = new Resend(apiKey);
      const replyTo = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : 'info@reamar.cz';
      const { data, error } = await resend.emails.send({
        from: 'REAMAR <partners@reamar.group>',
        to: 'info@reamar.cz',
        reply_to: replyTo,
        subject: 'Yêu cầu mới từ website REAMAR',
        text: body,
        html: '<pre style="font-family:sans-serif;white-space:pre-wrap;">' + body.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</pre>',
      });
      if (error) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message ?? 'Không gửi được e-mail.',
        });
      }
      return { success: true, id: data?.id };
    },
  }),
};
