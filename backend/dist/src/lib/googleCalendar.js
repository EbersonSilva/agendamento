import { google } from "googleapis";
import { prisma } from "./prisma.js";
/**
 * Gets an authenticated Google OAuth2 Client.
 * If credentials do not exist, returns null.
 */
export async function getAuthenticatedClient() {
    try {
        const config = await prisma.googleConfig.findFirst();
        if (!config) {
            return null;
        }
        const client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
        client.setCredentials({
            access_token: config.accessToken,
            refresh_token: config.refreshToken,
            expiry_date: config.expiryDate.getTime(),
        });
        // Listen to token refresh events on this client instance and save new tokens to database
        client.on("tokens", async (tokens) => {
            try {
                const currentConfig = await prisma.googleConfig.findFirst();
                if (!currentConfig)
                    return;
                const dataToUpdate = {
                    accessToken: tokens.access_token,
                    expiryDate: new Date(tokens.expiry_date),
                };
                if (tokens.refresh_token) {
                    dataToUpdate.refreshToken = tokens.refresh_token;
                }
                await prisma.googleConfig.update({
                    where: { id: currentConfig.id },
                    data: dataToUpdate,
                });
                console.log("[Google Calendar] Access token refreshed and saved successfully.");
            }
            catch (error) {
                console.error("[Google Calendar] Error saving refreshed tokens:", error);
            }
        });
        return client;
    }
    catch (error) {
        console.error("[Google Calendar] Failed to authenticate client:", error);
        return null;
    }
}
/**
 * Creates or updates an event in the user's primary Google Calendar.
 */
export async function upsertCalendarEvent(appointmentId) {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth) {
            console.log(`[Google Calendar] Integration not configured. Skipping sync for appointment #${appointmentId}`);
            return;
        }
        const appointment = await prisma.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                client: true,
                service: true,
            },
        });
        if (!appointment) {
            console.error(`[Google Calendar] Appointment #${appointmentId} not found for sync.`);
            return;
        }
        const calendar = google.calendar({ version: "v3", auth });
        // Determina o título do evento com base no status
        const statusPrefix = appointment.status === "confirmed" ? "" : "[PENDENTE] ";
        const summary = `${statusPrefix}${appointment.service.name} - ${appointment.client.name}`;
        const description = `
📋 Agendamento no Beauty Studio
----------------------------------------
Cliente: ${appointment.client.name}
Telefone: ${appointment.client.phone}
Serviço: ${appointment.service.name}
Valor: R$ ${appointment.service.price.toString()}
Duração: ${appointment.service.durationMinutes} minutos
Status: ${appointment.status.toUpperCase()}
Notas: ${appointment.notes || "Nenhuma"}
----------------------------------------
Criado via Sistema de Agendamento
`.trim();
        const eventPayload = {
            summary,
            description,
            start: {
                dateTime: appointment.startTime.toISOString(),
                timeZone: "America/Sao_Paulo",
            },
            end: {
                dateTime: appointment.endTime.toISOString(),
                timeZone: "America/Sao_Paulo",
            },
        };
        if (appointment.googleEventId) {
            try {
                console.log(`[Google Calendar] Updating existing event: ${appointment.googleEventId}`);
                await calendar.events.update({
                    calendarId: "primary",
                    eventId: appointment.googleEventId,
                    requestBody: eventPayload,
                });
            }
            catch (err) {
                if (err.code === 404) {
                    console.warn("[Google Calendar] Event not found in Google Calendar, creating a new one instead.");
                    const newEvent = await calendar.events.insert({
                        calendarId: "primary",
                        requestBody: eventPayload,
                    });
                    await prisma.appointment.update({
                        where: { id: appointmentId },
                        data: { googleEventId: newEvent.data.id },
                    });
                }
                else {
                    throw err;
                }
            }
        }
        else {
            console.log("[Google Calendar] Creating new event");
            const newEvent = await calendar.events.insert({
                calendarId: "primary",
                requestBody: eventPayload,
            });
            await prisma.appointment.update({
                where: { id: appointmentId },
                data: { googleEventId: newEvent.data.id },
            });
        }
    }
    catch (error) {
        console.error(`[Google Calendar] Error syncing appointment #${appointmentId}:`, error);
    }
}
/**
 * Deletes an event from the user's primary Google Calendar.
 */
export async function deleteCalendarEvent(googleEventId) {
    try {
        const auth = await getAuthenticatedClient();
        if (!auth)
            return;
        const calendar = google.calendar({ version: "v3", auth });
        console.log(`[Google Calendar] Deleting event: ${googleEventId}`);
        await calendar.events.delete({
            calendarId: "primary",
            eventId: googleEventId,
        });
    }
    catch (error) {
        if (error.code === 404) {
            console.warn("[Google Calendar] Event already deleted in Google Calendar.");
        }
        else {
            console.error("[Google Calendar] Error deleting event:", error);
        }
    }
}
