export type FollowupActionType = 'note' | 'call' | 'whatsapp' | 'mentor_support' | 'watch' | 'resolved_note';
export type FollowupStatus = 'open' | 'in_progress' | 'resolved' | 'dismissed';
export type FollowupPriority = 'low' | 'normal' | 'high' | 'urgent';

export const validateFollowupPayload = (payload: any) => {
    let { actionType, priority, status, note, dueDate, dayNumber } = payload || {};

    note = typeof note === 'string' ? note.trim().substring(0, 2000) : '';

    if (!note) {
        return { error: 'Not (note) boş olamaz.' };
    }

    const validActions = ['note','call','whatsapp','mentor_support','watch','resolved_note'];
    if (!validActions.includes(actionType)) {
        actionType = 'note';
    }

    const validPriorities = ['low','normal','high','urgent'];
    if (!validPriorities.includes(priority)) {
        priority = 'normal';
    }

    const validStatuses = ['open','in_progress','resolved','dismissed'];
    if (status && !validStatuses.includes(status)) {
        status = 'open';
    }

    const day = typeof dayNumber === 'number' ? (dayNumber >= 1 && dayNumber <= 90 ? dayNumber : null) : null;

    let parsedDueDate = null;
    if (dueDate) {
        const d = new Date(dueDate);
        if (!isNaN(d.getTime())) {
            parsedDueDate = d.toISOString().split('T')[0];
        }
    }

    return {
        valid: true,
        data: {
            action_type: actionType as FollowupActionType,
            priority: priority as FollowupPriority,
            status: (status || 'open') as FollowupStatus,
            note,
            due_date: parsedDueDate,
            day_number: day
        }
    };
};

export const formatActionType = (type: FollowupActionType | string) => {
    const map: Record<string, string> = {
        'note': 'Genel Not',
        'call': 'Telefon Araması',
        'whatsapp': 'WhatsApp Mesajı',
        'mentor_support': 'Mentor Desteği',
        'watch': 'Gözlem Altında',
        'resolved_note': 'Çözüldü Notu'
    };
    return map[type] || type;
};

export const formatPriority = (priority: FollowupPriority | string) => {
    const map: Record<string, string> = {
        'low': 'Düşük',
        'normal': 'Normal',
        'high': 'Yüksek',
        'urgent': 'Acil'
    };
    return map[priority] || priority;
};

export const getPriorityColor = (priority: FollowupPriority | string) => {
    switch (priority) {
        case 'urgent': return 'text-rose-600 bg-rose-50 border-rose-200';
        case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'low': return 'text-slate-600 bg-slate-50 border-slate-200';
        default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
};

export const formatStatus = (status: FollowupStatus | string) => {
    const map: Record<string, string> = {
        'open': 'Açık',
        'in_progress': 'İşlemde',
        'resolved': 'Çözüldü',
        'dismissed': 'İptal Edildi'
    };
    return map[status] || status;
};
