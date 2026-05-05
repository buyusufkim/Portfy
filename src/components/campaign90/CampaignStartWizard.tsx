import React, { useState, useEffect } from 'react';
import { Card } from '../UI';
import { motion, AnimatePresence } from 'motion/react';
import { Briefcase, Building, MapPin, Target, Activity, ShieldCheck, Award, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { AdvisorProfessionalProfile, AdvisorExperienceLevel, TaxIdentityType, WorkIntensity } from '../../types';
import { useAuth } from '../../AuthContext';
import { supabase } from '../../lib/supabase';
import { maskIdentity } from '../../services/advisorProfileService';
import toast from 'react-hot-toast';

interface Props {
    isPending: boolean;
    onComplete: (data: Partial<AdvisorProfessionalProfile> & { package_action?: 'free' | 'trial' | 'pro_request' }) => void;
    mode?: 'profile_onboarding' | 'campaign_start';
}

export const CampaignStartWizard: React.FC<Props> = ({ isPending, onComplete, mode = 'campaign_start' }) => {
    const { user, profile, subscribe } = useAuth();
    const [step, setStep] = useState(1);
    
    // Step 1
    const [experience_level, setExperienceLevel] = useState<AdvisorExperienceLevel>('new');
    const [current_role, setCurrentRole] = useState('');
    const [experience_years, setExperienceYears] = useState('');
    const [profession_start_date, setProfessionStartDate] = useState('');

    // Step 2
    const [has_myk, setHasMyk] = useState<boolean>(false);
    const [myk_level, setMykLevel] = useState('');
    const [myk_certificate_no, setMykCertificateNo] = useState('');
    const [myk_issue_date, setMykIssueDate] = useState('');
    const [myk_renewal_date, setMykRenewalDate] = useState('');
    const [has_real_estate_authorization, setHasRealEstateAuthorization] = useState<boolean>(false);
    const [authorization_no, setAuthorizationNo] = useState('');
    const [authorization_issue_date, setAuthorizationIssueDate] = useState('');
    const [authorization_renewal_date, setAuthorizationRenewalDate] = useState('');

    // Step 3
    const [has_office, setHasOffice] = useState<boolean>(false);
    const [office_name, setOfficeName] = useState('');
    const [office_brand, setOfficeBrand] = useState('');
    const [office_role, setOfficeRole] = useState('');
    const [tax_identity_type, setTaxIdentityType] = useState<TaxIdentityType>('none');
    const [taxIdentityRaw, setTaxIdentityRaw] = useState('');

    // Step 4
    const [region, setRegion] = useState('');
    const [niche, setNiche] = useState('');

    // Step 5
    const [daily_available_hours, setDailyAvailableHours] = useState('full');
    const [preferred_work_intensity, setPreferredWorkIntensity] = useState<WorkIntensity>('standard');

    const experienceOptions: { id: AdvisorExperienceLevel; label: string }[] = [
        { id: 'new', label: 'Yeni başlıyorum' },
        { id: 'experienced', label: 'Tecrübeliyim' },
    ];

    const taxOptions: { id: TaxIdentityType; label: string }[] = [
        { id: 'none', label: 'Girmek İstemiyorum' },
        { id: 'tc', label: 'TC Kimlik No' },
        { id: 'vkn', label: 'Vergi Kimlik No' },
    ];

    const intensityOptions: { id: WorkIntensity; label: string; sub: string; w: number }[] = [
        { id: 'light', label: 'Hafif', sub: 'Günde ~10 Temas', w: 50 },
        { id: 'standard', label: 'Standart', sub: 'Günde ~20 Temas', w: 100 },
        { id: 'intense', label: 'Yoğun', sub: 'Günde ~35 Temas', w: 175 },
    ];

    useEffect(() => {
        if (user?.id) {
            supabase.from('profiles').select('district, region, expertise_areas').eq('id', user.id).single()
                .then(({ data }) => {
                    if (data) {
                        const dist = data.district || data.region?.district || '';
                        if (dist) setRegion(dist);
                        const exp = data.expertise_areas?.join(', ') || '';
                        if (exp) setNiche(exp);
                    }
                });
        }
    }, [user?.id]);

    const handleNext = () => setStep(prev => prev + 1);
    const handlePrev = () => setStep(prev => Math.max(1, prev - 1));

    const handleSubmit = (package_action?: 'free' | 'trial' | 'pro_request') => {
        const payload: Partial<AdvisorProfessionalProfile> & { package_action?: 'free' | 'trial' | 'pro_request' } = {
            experience_level,
            current_role: current_role || null,
            experience_years: experience_years ? parseInt(experience_years, 10) : null,
            profession_start_date: profession_start_date || (experience_level === 'new' ? new Date().toISOString() : null),
            has_myk,
            myk_level: has_myk ? myk_level : null,
            myk_certificate_no: has_myk ? myk_certificate_no : null,
            myk_issue_date: has_myk ? myk_issue_date : null,
            myk_renewal_date: has_myk ? myk_renewal_date : null,
            has_real_estate_authorization,
            authorization_no: has_real_estate_authorization ? authorization_no : null,
            authorization_issue_date: has_real_estate_authorization ? authorization_issue_date : null,
            authorization_renewal_date: has_real_estate_authorization ? authorization_renewal_date : null,
            has_office,
            office_name: has_office ? office_name : null,
            office_brand: has_office ? office_brand : null,
            office_role: has_office ? office_role : null,
            has_tax_registration: tax_identity_type !== 'none',
            tax_identity_type: tax_identity_type !== 'none' ? tax_identity_type : null,
            tax_identity_masked: maskIdentity(taxIdentityRaw, tax_identity_type),
            tax_identity_last4: taxIdentityRaw ? taxIdentityRaw.slice(-4) : null,
            region,
            niche,
            preferred_work_intensity,
            daily_available_hours: daily_available_hours === 'full' ? 8 : parseInt(daily_available_hours, 10),
            daily_contact_target: preferred_work_intensity === 'light' ? 10 : preferred_work_intensity === 'intense' ? 35 : 20,
            weekly_contact_target: (preferred_work_intensity === 'light' ? 10 : preferred_work_intensity === 'intense' ? 35 : 20) * 5,
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            package_action
        };

        onComplete(payload);
    };

    const isStep1Valid = experience_level === 'new' || !!experience_years || !!profession_start_date;
    const isStep2Valid = 
        (!has_myk || (!!myk_level && !!myk_certificate_no)) && 
        (!has_real_estate_authorization || !!authorization_no);
    const isStep3Valid = !has_office || !!office_name;
    const isStep4Valid = !!region && !!niche;

    return (
        <div className="max-w-2xl mx-auto py-8">
            <Card className="bg-white border border-slate-200 overflow-hidden rounded-3xl shadow-xl shadow-slate-200/50">
                <div className="bg-slate-900 p-6 sm:p-8 text-white relative">
                    <div className="absolute right-0 top-0 opacity-10 pointer-events-none -mt-4 -mr-4">
                        <Award size={160} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black mb-2">
                            {mode === 'profile_onboarding' ? 'Profesyonel Profilini Oluşturalım' : '90 Gün Kampı Başlangıç Ayarı'}
                        </h2>
                        <p className="text-slate-300 font-medium text-sm">
                            {mode === 'profile_onboarding' ? 'Portfy seni doğru yönlendirebilmek için mesleki durumunu, uzmanlık bölgeni ve çalışma düzenini tanır.' : 'Portfy önce seni tanır, sonra sana doğru kamp ritmini verir.'}
                        </p>
                    </div>

                    <div className="flex gap-2 mt-8 relative z-10">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-[#00D2B4]' : 'bg-white/20'}`} />
                        ))}
                    </div>
                </div>

                <div className="p-6 sm:p-8">
                    <AnimatePresence mode="wait">
                        
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Briefcase className="text-indigo-500" /> Mesleki Durum</h3>
                                
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Gayrimenkul danışmanlığında şu an hangi durumdasın?</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {experienceOptions.map(opt => (
                                                <div 
                                                    key={opt.id} 
                                                    onClick={() => setExperienceLevel(opt.id)}
                                                    className={`cursor-pointer rounded-xl border-2 p-4 flex items-center justify-between transition-all ${experience_level === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 hover:border-indigo-200'}`}
                                                >
                                                    <span className="font-bold text-sm">{opt.label}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${experience_level === opt.id ? 'border-indigo-500' : 'border-slate-300'}`}>
                                                        {experience_level === opt.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {experience_level === 'new' && (
                                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
                                            <p className="text-sm text-indigo-700 font-medium whitespace-pre-line">
                                                İlk 3 gün seni doğrudan sahaya sürmeyeceğiz. Önce evrak, ofis, MYK, yetki ve güvenli çalışma zeminini kuracağız.
                                                {mode === 'profile_onboarding' ? 'Bu başlangıç aşaması senin temel saha disiplinini kuracak ve doğru alışkanlıkları kazanmanı sağlayacak.' : 'Bu kamp senin temel saha disiplinini kuracak ve doğru alışkanlıkları kazanmanı sağlayacak.'}
                                            </p>
                                        </div>
                                    )}

                                    {experience_level === 'experienced' && (
                                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-4">
                                            <p className="text-sm text-indigo-700 font-medium">{mode === 'profile_onboarding' ? 'Profilin mevcut alışkanlıklarını ölçüp, sistemleştirerek seni bir üst seviyeye taşımamızı sağlayacak.' : 'Kamp mevcut alışkanlıklarını ölçüp, sistemleştirerek bir üst seviyeye taşımanı sağlayacak.'}</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Rolün (Opsiyonel)</label>
                                        <select 
                                            value={current_role} 
                                            onChange={e => setCurrentRole(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                                        >
                                            <option value="">Seçiniz</option>
                                            <option value="advisor">Danışman</option>
                                            <option value="broker">Broker / Ofis Sahibi</option>
                                            <option value="assistant">Asistan / Ekip Üyesi</option>
                                        </select>
                                    </div>

                                    {experience_level === 'experienced' && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Tecrübe (Yıl)</label>
                                                <input 
                                                    type="number" 
                                                    value={experience_years} 
                                                    onChange={e => setExperienceYears(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                                    placeholder="Örn: 3"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Başlangıç Tarihi</label>
                                                <input 
                                                    type="date" 
                                                    value={profession_start_date} 
                                                    onChange={e => setProfessionStartDate(e.target.value)}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-700 focus:outline-none focus:border-indigo-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <button onClick={handleNext} disabled={!isStep1Valid} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
                                            İleri <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2"><ShieldCheck className="text-indigo-500" /> Resmi Evraklar</h3>
                                <p className="text-xs text-slate-500 font-medium mb-6">MYK ve yetki tarihlerini takip etmek, ileride rapor ve hatırlatmalarda işine yarar.</p>

                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={has_myk} onChange={e => setHasMyk(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                                        <span className="font-bold text-slate-700">MYK Belgem Var</span>
                                    </label>

                                    {has_myk && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">MYK Seviyesi*</label>
                                                    <select value={myk_level} onChange={e => setMykLevel(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500">
                                                        <option value="">Seçiniz</option>
                                                        <option value="4">Seviye 4</option>
                                                        <option value="5">Seviye 5 (Sorumlu Emlak Danışmanı)</option>
                                                        <option value="unknown">Emin Değilim</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Belge No*</label>
                                                    <input type="text" value={myk_certificate_no} onChange={e => setMykCertificateNo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Veriliş / Başlangıç Tarihi (Opsiyonel)</label>
                                                    <input type="date" value={myk_issue_date} onChange={e => setMykIssueDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Yenileme / Geçerlilik Tarihi (Opsiyonel)</label>
                                                    <input type="date" value={myk_renewal_date} onChange={e => setMykRenewalDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={has_real_estate_authorization} onChange={e => setHasRealEstateAuthorization(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                                        <span className="font-bold text-slate-700">Taşınmaz Ticareti Yetki Belgem Var</span>
                                    </label>

                                    {has_real_estate_authorization && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                             <div>
                                                 <label className="block text-sm font-bold text-slate-700 mb-2">Yetki No*</label>
                                                 <input type="text" value={authorization_no} onChange={e => setAuthorizationNo(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                             </div>
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Yetki Veriliş Tarihi (Opsiyonel)</label>
                                                    <input type="date" value={authorization_issue_date} onChange={e => setAuthorizationIssueDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-2">Yetki Yenileme Tarihi (Opsiyonel)</label>
                                                    <input type="date" value={authorization_renewal_date} onChange={e => setAuthorizationRenewalDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                                </div>
                                             </div>
                                        </div>
                                    )}

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrev} className="text-slate-600 hover:text-slate-800 font-bold py-3 px-6 transition-colors flex items-center gap-2">
                                            <ChevronLeft size={18} /> Geri
                                        </button>
                                        <button onClick={handleNext} disabled={!isStep2Valid} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
                                            İleri <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Building className="text-indigo-500" /> Ofis ve Ticari Bilgi</h3>

                                <div className="space-y-6">
                                    <label className="flex items-center gap-3 p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                                        <input type="checkbox" checked={has_office} onChange={e => setHasOffice(e.target.checked)} className="w-5 h-5 text-indigo-600 rounded" />
                                        <span className="font-bold text-slate-700">Bağlı Olduğum Ofis Var</span>
                                    </label>

                                    {has_office && (
                                        <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Ofis Adı*</label>
                                                <input type="text" value={office_name} onChange={e => setOfficeName(e.target.value)} placeholder="Örn: Coldwell Banker X" className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-slate-700 mb-2">Marka / Franchise Adı (Opsiyonel)</label>
                                                <input type="text" value={office_brand} onChange={e => setOfficeBrand(e.target.value)} placeholder="Örn: Remax, Keller Williams" className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-200">
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Vergi/Kimlik Bilgisi</label>
                                        <p className="text-xs text-red-500 font-bold mb-3">Bu bilgi müşteri raporlarında açık gösterilmez ve şifrelenir.</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                                            {taxOptions.map(opt => (
                                                <div 
                                                    key={opt.id} 
                                                    onClick={() => setTaxIdentityType(opt.id)}
                                                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${tax_identity_type === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-indigo-200 text-slate-600 font-medium'}`}
                                                >
                                                    <span className="text-sm">{opt.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {tax_identity_type !== 'none' && (
                                            <input 
                                                type="text" 
                                                value={taxIdentityRaw} 
                                                onChange={e => setTaxIdentityRaw(e.target.value)} 
                                                placeholder={tax_identity_type === 'tc' ? "11 Haneli TC Kimlik No" : "10 Haneli Vergi No"} 
                                                className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500 font-mono"
                                            />
                                        )}
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrev} className="text-slate-600 hover:text-slate-800 font-bold py-3 px-6 transition-colors flex items-center gap-2">
                                            <ChevronLeft size={18} /> Geri
                                        </button>
                                        <button onClick={handleNext} disabled={!isStep3Valid} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
                                            İleri <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 4 && (
                            <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><MapPin className="text-indigo-500" /> Uzmanlık Bölgesi ve Alanı</h3>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Uzmanlık Bölgen*</label>
                                        <input 
                                            type="text" 
                                            value={region} 
                                            onChange={e => setRegion(e.target.value)} 
                                            placeholder="Örn: Talas, Yenidoğan, Çankaya" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500"
                                        />
                                        <p className="text-xs text-slate-500 mt-2 font-medium">İlk 90 gün tek mikro bölgeye odaklanmak başarı şansını artırır.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Uzmanlık Alanın*</label>
                                        <input 
                                            type="text" 
                                            value={niche} 
                                            onChange={e => setNiche(e.target.value)} 
                                            placeholder="Örn: Satılık Daire, Lüks Konut, Ticari" 
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:border-indigo-500"
                                        />
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrev} className="text-slate-600 hover:text-slate-800 font-bold py-3 px-6 transition-colors flex items-center gap-2">
                                            <ChevronLeft size={18} /> Geri
                                        </button>
                                        <button onClick={handleNext} disabled={!isStep4Valid} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50">
                                            İleri <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 5 && (
                            <motion.div key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2"><Activity className="text-indigo-500" /> {mode === 'profile_onboarding' ? 'Çalışma Kapasiten' : 'Çalışma Kapasitesi'}</h3>
                                <p className="text-xs text-slate-500 font-medium mb-6">Motivasyon değil, sürdürülebilir tempo kazandırır.</p>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-3">Günde bu işe ortalama kaç saat ayırabilirsin?</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { id: '2', label: '1-2 Saat' },
                                                { id: '4', label: '3-4 Saat' },
                                                { id: '6', label: '5-6 Saat' },
                                                { id: 'full', label: 'Tam Zamanlı' },
                                            ].map(opt => (
                                                <div 
                                                    key={opt.id} 
                                                    onClick={() => setDailyAvailableHours(opt.id)}
                                                    className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${daily_available_hours === opt.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 hover:border-indigo-200 text-slate-600 font-medium'}`}
                                                >
                                                    <span className="text-sm">{opt.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <label className="block text-sm font-bold text-slate-700 mb-3">{mode === 'profile_onboarding' ? 'Günlük Temas Hedefi / Temposu' : 'Günlük Kamp Hedefi / Temposu'}</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {intensityOptions.map(opt => (
                                                <div 
                                                    key={opt.id} 
                                                    onClick={() => setPreferredWorkIntensity(opt.id)}
                                                    className={`cursor-pointer rounded-xl border-2 p-4 text-center transition-all ${preferred_work_intensity === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-200'}`}
                                                >
                                                    <div className={`font-black mb-1 ${preferred_work_intensity === opt.id ? 'text-indigo-700' : 'text-slate-700'}`}>{opt.label}</div>
                                                    <div className={`text-xs font-bold ${preferred_work_intensity === opt.id ? 'text-indigo-500' : 'text-slate-500'}`}>{opt.sub}</div>
                                                    <div className={`text-[10px] mt-2 ${preferred_work_intensity === opt.id ? 'text-indigo-400' : 'text-slate-400'}`}>Hft: {opt.w} Temas</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex justify-between pt-4">
                                        <button onClick={handlePrev} className="text-slate-600 hover:text-slate-800 font-bold py-3 px-6 transition-colors flex items-center gap-2">
                                            <ChevronLeft size={18} /> Geri
                                        </button>
                                        <button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center gap-2">
                                            İleri <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {step === 6 && (
                            <motion.div key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2"><Target className="text-indigo-500" /> {mode === 'profile_onboarding' ? 'Profesyonel profilin hazır' : 'Kamp hedeflerin hazır'}</h3>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 mb-8">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">Mesleki Durum</span>
                                        <span className="text-sm font-black text-slate-800">{experience_level === 'new' ? 'Yeni Başlayan' : 'Tecrübeli'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">MYK & Yetki</span>
                                        <span className="text-sm font-black text-slate-800">{has_myk ? 'Var' : 'Yok'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">Ofis</span>
                                        <span className="text-sm font-black text-slate-800">{has_office ? office_name : 'Bağımsız'}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">Odak Bölge</span>
                                        <span className="text-sm font-black text-indigo-600">{region}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                        <span className="text-sm font-bold text-slate-500">Odak Alan</span>
                                        <span className="text-sm font-black text-indigo-600">{niche}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-bold text-slate-500">Günlük Temas Hedefi</span>
                                        <span className="text-sm font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md">
                                            {preferred_work_intensity === 'light' ? '10' : preferred_work_intensity === 'intense' ? '35' : '20'} Kişi
                                        </span>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <button onClick={handlePrev} className="text-slate-600 hover:text-slate-800 font-bold py-3 px-6 transition-colors flex items-center gap-2">
                                        <ChevronLeft size={18} /> Geri
                                    </button>
                                    <button 
                                        onClick={mode === 'profile_onboarding' ? () => setStep(7) : () => handleSubmit()} 
                                        disabled={isPending}
                                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 px-8 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {isPending && mode !== 'profile_onboarding' ? 'Başlatılıyor...' : (mode === 'profile_onboarding' ? 'Paket Seçimine İlerle' : 'Hedefi Onayla ve Kampı Başlat')}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {mode === 'profile_onboarding' && step === 7 && (
                            <motion.div key="step7" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                                    <Award className="text-indigo-500" /> Paketini Seç
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    {/* Free */}
                                    <div className="bg-white border-2 border-slate-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-lg hover:border-slate-300 transition-all cursor-pointer" onClick={() => handleSubmit('free')}>
                                        <h4 className="text-xl font-bold text-slate-800 mb-2">Ücretsiz Başlangıç</h4>
                                        <p className="text-sm text-slate-500 font-medium mb-6">Portfy’yi temel özelliklerle kullanmaya devam et.</p>
                                        <ul className="text-left space-y-3 mb-8 text-sm text-slate-600 font-medium w-full flex-grow">
                                            <li className="flex items-start gap-2"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5"/> Temel Dashboard</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5"/> CRM kayıtları</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5"/> Günlük Akış</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5"/> Sınırlı AI kullanımı</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-emerald-500 shrink-0 mt-0.5"/> 90 Gün Kampı inceleme</li>
                                        </ul>
                                        <button disabled={isPending} className="w-full py-3 bg-slate-100 text-slate-800 rounded-xl font-bold hover:bg-slate-200 transition mt-auto">
                                            {isPending ? 'Kaydediliyor...' : 'Ücretsiz Devam Et'}
                                        </button>
                                    </div>

                                    {/* Trial */}
                                    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-3xl p-6 flex flex-col items-center text-center shadow-lg hover:border-indigo-300 transition-all cursor-pointer relative" onClick={() => handleSubmit('trial')}>
                                        <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                            Tavsiye Edilen
                                        </div>
                                        <h4 className="text-xl font-bold text-indigo-900 mb-2">7 Gün Deneme</h4>
                                        <p className="text-sm text-indigo-600 font-medium mb-6">90 Gün Kampı ve gelişmiş Portfy özelliklerini 7 gün dene.</p>
                                        <ul className="text-left space-y-3 mb-8 text-sm text-indigo-800 font-medium w-full flex-grow">
                                            <li className="flex items-start gap-2"><Check size={16} className="text-indigo-500 shrink-0 mt-0.5"/> 90 Gün Kampı erişimi</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-indigo-500 shrink-0 mt-0.5"/> Kamp ilerleme takibi</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-indigo-500 shrink-0 mt-0.5"/> Meslek sözlüğü & quiz</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-indigo-500 shrink-0 mt-0.5"/> AI Koç içgörüleri</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-indigo-500 shrink-0 mt-0.5"/> Gelişmiş takip deneyimi</li>
                                        </ul>
                                        <button disabled={isPending} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition mt-auto">
                                            {isPending ? 'Kaydediliyor...' : '7 Gün Denemeyi Başlat'}
                                        </button>
                                    </div>

                                    {/* Pro */}
                                    <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center text-center shadow-2xl hover:border-slate-700 transition-all cursor-pointer" onClick={() => handleSubmit('pro_request')}>
                                        <h4 className="text-xl font-bold text-white mb-2">Portfy Pro</h4>
                                        <p className="text-sm text-slate-400 font-medium mb-6">Trial sonrası tam erişim ve gelişmiş takip sistemiyle devam et.</p>
                                        <ul className="text-left space-y-3 mb-8 text-sm text-slate-300 font-medium w-full flex-grow">
                                            <li className="flex items-start gap-2"><Check size={16} className="text-[#00D2B4] shrink-0 mt-0.5"/> 90 Gün Kampı tam erişim</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-[#00D2B4] shrink-0 mt-0.5"/> Gelişmiş CRM takipleri</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-[#00D2B4] shrink-0 mt-0.5"/> Sessiz aday & takip uyarıları</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-[#00D2B4] shrink-0 mt-0.5"/> Portföy sağlık takibi</li>
                                            <li className="flex items-start gap-2"><Check size={16} className="text-[#00D2B4] shrink-0 mt-0.5"/> Öncelikli destek</li>
                                        </ul>
                                        <div className="mb-4 text-white text-lg font-bold">Aylık 1999 TL<span className="text-xs text-slate-500 font-medium block">veya Fiyat Bilgisi Alın</span></div>
                                        <button disabled={isPending} className="w-full py-3 bg-[#00D2B4] text-slate-900 rounded-xl font-bold hover:bg-[#00e3c5] transition mt-auto">
                                            {isPending ? 'Kaydediliyor...' : 'Pro Paket Talebi Gönder'}
                                        </button>
                                    </div>
                                </div>
                                
                                <p className="text-xs text-slate-500 text-center font-medium">7 gün sonunda aktivasyon tamamlanmazsa hesabın kapanmaz; ücretsiz paketten devam edersin. Paket seçimini daha sonra ayarlardan değiştirebilirsin.</p>

                                <div className="flex justify-start mt-6">
                                    <button onClick={handlePrev} className="text-slate-600 hover:text-slate-800 font-bold py-3 px-6 transition-colors flex items-center gap-2">
                                        <ChevronLeft size={18} /> Geri
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
};
