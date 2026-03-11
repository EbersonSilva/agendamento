import nodemailer from 'nodemailer';
// Configura o transporte usando as variáveis de ambiente do .env
// Suporta Gmail, Outlook, SMTP genérico, etc.
export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
export async function sendAppointmentNotification(data) {
    const dateStr = data.startTime.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        timeZone: 'America/Sao_Paulo',
    });
    const timeStr = data.startTime.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
    });
    const subject = data.isManual
        ? `✅ Agendamento manual: ${data.clientName} às ${timeStr}`
        : `📅 Novo agendamento: ${data.clientName} às ${timeStr}`;
    const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #f9f9f9; border-radius: 12px; overflow: hidden;">
      <div style="background: #18181b; padding: 24px; text-align: center;">
        <h2 style="color: #fff; margin: 0; font-size: 20px;">
          ${data.isManual ? '✅ Agendamento Manual' : '📅 Novo Agendamento'}
        </h2>
      </div>
      <div style="padding: 24px; background: #fff;">
        <table style="width: 100%; border-collapse: separate; border-spacing: 0 8px;">
          <tr>
            <td style="color: #71717a; font-size: 13px; width: 110px;">Cliente</td>
            <td style="font-weight: bold; color: #18181b;">${data.clientName}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-size: 13px;">WhatsApp</td>
            <td style="color: #18181b;">${data.clientPhone}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-size: 13px;">Serviço</td>
            <td style="color: #18181b;">${data.serviceName}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-size: 13px;">Data</td>
            <td style="color: #18181b; text-transform: capitalize;">${dateStr}</td>
          </tr>
          <tr>
            <td style="color: #71717a; font-size: 13px;">Horário</td>
            <td style="font-weight: bold; color: #18181b; font-size: 18px;">${timeStr}</td>
          </tr>
          ${data.isManual ? '' : `
          <tr>
            <td colspan="2" style="padding-top: 12px;">
              <div style="background: #fef9c3; border: 1px solid #fde047; border-radius: 8px; padding: 10px 14px; color: #854d0e; font-size: 13px;">
                ⏳ Este agendamento está <strong>pendente</strong> — acesse o painel para confirmar ou recusar.
              </div>
            </td>
          </tr>`}
        </table>
      </div>
      <div style="padding: 16px 24px; background: #f4f4f5; text-align: center;">
        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">Notificação automática do sistema de agendamento</p>
      </div>
    </div>
  `;
    await transporter.sendMail({
        from: `"Agendamento Estúdio" <${process.env.SMTP_USER}>`,
        to: data.ownerEmail,
        subject,
        html,
    });
}
