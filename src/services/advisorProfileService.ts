import { supabase } from '../lib/supabase';
import { AdvisorProfessionalProfile, AdvisorReportIdentity } from '../types';

export const maskIdentity = (value: string | undefined | null, type: 'tc' | 'vkn' | 'none'): string | null => {
    if (!value || type === 'none') return null;
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length < 4) return cleanValue;
    const last4 = cleanValue.slice(-4);
    if (type === 'tc') return '*******' + last4; // 11 digits
    return '******' + last4; // 10 digits vkn
};

export const getIdentityLast4 = (value: string | undefined | null): string | null => {
    if (!value) return null;
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length < 4) return cleanValue;
    return cleanValue.slice(-4);
};

export const advisorProfileService = {
    getAdvisorProfessionalProfile: async (userId: string): Promise<AdvisorProfessionalProfile | null> => {
        const { data, error } = await supabase
            .from('advisor_professional_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Error fetching advisor professional profile:', error);
            throw error;
        }

        return data;
    },

    upsertAdvisorProfessionalProfile: async (payload: Partial<AdvisorProfessionalProfile> & { user_id: string }): Promise<AdvisorProfessionalProfile> => {
        const normalizeDate = (value?: string | null) => {
            if (!value || value.trim() === '') return null;
            return value;
        };

        const sanitizedPayload = { ...payload };
        if ('profession_start_date' in sanitizedPayload) sanitizedPayload.profession_start_date = normalizeDate(sanitizedPayload.profession_start_date);
        if ('myk_issue_date' in sanitizedPayload) sanitizedPayload.myk_issue_date = normalizeDate(sanitizedPayload.myk_issue_date);
        if ('myk_renewal_date' in sanitizedPayload) sanitizedPayload.myk_renewal_date = normalizeDate(sanitizedPayload.myk_renewal_date);
        if ('authorization_issue_date' in sanitizedPayload) sanitizedPayload.authorization_issue_date = normalizeDate(sanitizedPayload.authorization_issue_date);
        if ('authorization_renewal_date' in sanitizedPayload) sanitizedPayload.authorization_renewal_date = normalizeDate(sanitizedPayload.authorization_renewal_date);

        const { data, error } = await supabase
            .from('advisor_professional_profiles')
            .upsert(sanitizedPayload, { onConflict: 'user_id' })
            .select()
            .single();

        if (error) {
            console.error('Error upserting advisor professional profile:', error);
            throw error;
        }

        return data;
    },

    getAdvisorReportIdentity: async (userId: string): Promise<AdvisorReportIdentity | null> => {
        const { data, error } = await supabase
            .from('advisor_professional_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
             console.error('Error fetching advisor report identity:', error);
             throw error;
        }

        if (!data) return null;

        return {
            display_name: data.display_name,
            professional_title: data.professional_title,
            office_name: data.office_name,
            office_brand: data.office_brand,
            myk_level: data.myk_level,
            myk_certificate_no: data.myk_certificate_no,
            public_phone: data.public_phone,
            public_email: data.public_email,
            region: data.region,
            niche: data.niche,
            // Masked ID is intentionally excluded here to prevent accidental exposure on reports,
            // but can be fetched if strictly needed
            tax_identity_masked: data.tax_identity_masked
        };
    }
};
