import React from 'react';

interface GoogleCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: {
        day: string;
        date: string;
        time: string;
        month?: string;
    } | null;
    clinicName?: string;
}

// Helper to generate Google Calendar URL
const generateGoogleCalendarUrl = (
    appointment: { day: string; date: string; time: string; month?: string },
    clinicName: string
): string => {
    // Parse the appointment time
    const timeMatch = appointment.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return '';

    let hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const period = timeMatch[3].toUpperCase();

    // Convert to 24-hour format
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    // Build the date - use current year and calculate month
    const monthNames: { [key: string]: number } = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };

    const today = new Date();
    let year = today.getFullYear();
    let month: number;

    if (appointment.month && monthNames[appointment.month] !== undefined) {
        month = monthNames[appointment.month];
        // Handle year rollover
        if (month < today.getMonth()) {
            year += 1;
        }
    } else {
        month = today.getMonth();
    }

    const appointmentDate = new Date(year, month, parseInt(appointment.date), hours, minutes);

    // End time is 1 hour after start
    const endDate = new Date(appointmentDate);
    endDate.setHours(endDate.getHours() + 1);

    // Format dates for Google Calendar (YYYYMMDDTHHmmss)
    const formatDate = (d: Date): string => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const startStr = formatDate(appointmentDate);
    const endStr = formatDate(endDate);

    // Build Google Calendar URL
    const title = encodeURIComponent(`Medical Appointment - ${clinicName}`);
    const details = encodeURIComponent(`Appointment at ${clinicName}\nScheduled via HerculesAI`);
    const location = encodeURIComponent(clinicName);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`;
};

const GoogleCalendarModal: React.FC<GoogleCalendarModalProps> = ({
    isOpen,
    onClose,
    appointment,
    clinicName = 'Medical Clinic'
}) => {
    if (!isOpen || !appointment) return null;

    const calendarUrl = generateGoogleCalendarUrl(appointment, clinicName);

    const handleAddToCalendar = () => {
        window.open(calendarUrl, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 duration-300">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="size-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="material-symbols-outlined text-white text-4xl">calendar_month</span>
                    </div>
                </div>

                {/* Title */}
                <h3 className="serif-font text-2xl text-center text-primary mb-2">
                    Add to Google Calendar?
                </h3>

                {/* Appointment Details */}
                <div className="bg-soft-cream rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <span className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-lg">event</span>
                        </span>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Your Appointment</p>
                            <p className="font-bold text-primary">
                                {appointment.day}, {appointment.month || ''} {appointment.date} at {appointment.time}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-4 rounded-2xl text-sm font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-[0.98]"
                    >
                        No, thanks
                    </button>
                    <button
                        onClick={handleAddToCalendar}
                        className="flex-1 py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        Yes, add it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GoogleCalendarModal;
