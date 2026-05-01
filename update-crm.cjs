const fs = require('fs');

const path = './src/components/CRMView.tsx';
let txt = fs.readFileSync(path, 'utf8');

// I am replacing everything from:
// return (
//   <motion.div
// down to the end of the file.

const startMarker = '  return (\n    <motion.div \n      initial={{ opacity: 0 }}\n      animate={{ opacity: 1 }}\n      className="p-6 space-y-6"\n    >';

if (!txt.includes(startMarker)) {
  console.log("Could not find start marker");
  process.exit(1);
}

const beforeReturn = txt.substring(0, txt.indexOf(startMarker));

const newReturn = `  const renderCRMSummary = () => (
    <Card className="p-5 border-slate-100 shadow-sm space-y-4">
      <h3 className="font-bold text-slate-800 flex items-center gap-2">
        <Users size={18} className="text-blue-500" /> CRM Özeti
      </h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col justify-center">
           <p className="text-[10px] text-slate-500 font-bold mb-1">Toplam Kayıt</p>
           <p className="text-2xl font-black text-slate-900">{leads.length}</p>
        </div>
        <div className="bg-orange-50 p-3 rounded-2xl border border-orange-100 flex flex-col justify-center">
           <p className="text-[10px] text-orange-800 font-bold mb-1">Sıcak Lead</p>
           <p className="text-2xl font-black text-orange-600">{hotLeadCount}</p>
        </div>
        <div className="bg-red-50 p-3 rounded-2xl border border-red-100 flex flex-col justify-center">
           <p className="text-[10px] text-red-800 font-bold mb-1">Sessiz Risk</p>
           <p className="text-2xl font-black text-red-600">{leads.filter(isSilentLead).length}</p>
        </div>
        <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col justify-center">
           <p className="text-[10px] text-emerald-800 font-bold mb-1">Bölge Network</p>
           <p className="text-2xl font-black text-emerald-600">{leads.filter(l => l.type === 'Bölge Network').length}</p>
        </div>
      </div>
    </Card>
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto"
    >
      {/* 1. Başlık & 2. Üst aksiyonlar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">CRM</h1>
           <p className="text-sm font-medium text-slate-500">Müşteri, lead ve network takibini tek merkezden yönet.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button 
            id="btn-add-lead" 
            onClick={() => setShowAddLead(true)} 
            className="px-4 py-2 bg-slate-900 text-white rounded-xl shadow-lg border border-slate-800 flex items-center gap-2 text-sm font-bold hover:bg-slate-800 transition"
          >
            <Plus size={18} /> Yeni Kayıt
          </button>
          <button 
            onClick={() => setShowWhatsAppImport(true)} 
            className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-emerald-100 transition"
          >
            <MessageSquare size={18} /> WhatsApp Aktar
          </button>
          <button 
            onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
            disabled={isAnalyzingLeads || leads.length === 0}
            className="px-4 py-2 bg-purple-50 text-purple-600 border border-purple-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-purple-100 transition disabled:opacity-50"
          >
            {isAnalyzingLeads ? (
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={18} /></motion.div>
            ) : <Sparkles size={18} />}
            AI Analiz
          </button>
          {/* Sadece UI görseli olarak */}
          <button className="px-4 py-2 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl flex items-center gap-2 text-sm font-bold shadow-sm hover:bg-slate-100 transition">
            <Copy size={18} /> Kartvizit Tara
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* SOL ANA KOLON */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          {/* 3. Tablar */}
          <div className="flex border-b border-slate-200 w-full mb-2">
            <button 
              onClick={() => setActiveTab('rehber')} 
              className={\`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition-all border-b-2 \${activeTab === 'rehber' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            >
              <UserIcon size={16} /> Rehber
            </button>
            <button 
              onClick={() => setActiveTab('araclar')} 
              className={\`flex items-center gap-2 pb-3 px-4 text-sm font-bold transition-all border-b-2 \${activeTab === 'araclar' ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}\`}
            >
              <Globe size={16} /> Araçlar
            </button>
          </div>

          {activeTab === 'rehber' && (
            <>
              {/* 4. Arama ve filtreler */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Ara (isim, telefon, mahalle, not...)" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm shadow-sm"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm shadow-sm text-slate-700"
                >
                  <option value="all">Durum</option>
                  <option value="Aday">Aday</option>
                  <option value="Sıcak">Sıcak</option>
                  <option value="Yetki Alındı">Yetki Alındı</option>
                  <option value="Pasif">Pasif</option>
                </select>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as Lead['type'] | 'all')}
                  className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm shadow-sm text-slate-700"
                >
                  <option value="all">Tip</option>
                  {leadTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'recent' | 'name')}
                  className="bg-white border border-slate-200 rounded-2xl py-2.5 px-4 text-sm shadow-sm text-slate-700"
                >
                  <option value="recent">Sırala: Son İletişim</option>
                  <option value="name">İsme Göre</option>
                </select>
              </div>

              {/* 5. Segment chipleri */}
              <div className="flex overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 hide-scrollbar gap-2">
                {[
                  { id: 'all', label: 'Tümü' },
                  { id: 'customers', label: 'Müşteriler' },
                  { id: 'network', label: 'Bölge Network' },
                  { id: 'hot', label: 'Sıcak', dot: 'bg-orange-500' },
                  { id: 'silent', label: 'Sessiz', dot: 'bg-slate-400' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCrmSegment(tab.id as 'all' | 'customers' | 'network' | 'hot' | 'silent')}
                    className={\`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all \${
                      crmSegment === tab.id 
                        ? 'bg-emerald-500 text-white shadow-sm border border-emerald-600' 
                        : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                    }\`}
                  >
                    {tab.dot && <span className={\`w-2 h-2 rounded-full \${tab.dot}\`} />}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* CRM Özeti Kompakt (Sadece Mobilde) - 6. mobil sıra */}
              <div className="block xl:hidden">
                {renderCRMSummary()}
              </div>

              {/* 6(7). Takip uyarı bannerı */}
              {silentLeadAlerts.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle size={18} className="text-orange-500" />
                    <span className="text-orange-800 font-bold text-sm">
                      {silentLeadAlerts.length} sessiz müşteri, bugün temas bekliyor.
                    </span>
                  </div>
                  <button onClick={() => setCrmSegment('silent')} className="text-orange-600 font-semibold text-xs flex items-center gap-1">
                    Tümünü Gör &rarr;
                  </button>
                </motion.div>
              )}

              {/* 7(8). Lead listesi */}
              <div className="space-y-3">
                {leadsLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Card key={\`skeleton-\${i}\`} className="flex items-center justify-between p-4">
                      <div className="flex gap-4 items-center">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="w-32 h-4" />
                          <Skeleton className="w-20 h-3" />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : filteredLeads.length === 0 ? (
                  <Card className="text-center p-12 bg-slate-50 border border-dashed border-slate-200 space-y-3">
                    <p className="text-slate-500 text-sm">{
                      leads.length === 0 
                        ? "Henüz CRM kaydı yok. İlk müşterini, leadini veya bölge network kişini ekleyerek takibe başla."
                        : "Bu filtrelerle eşleşen kayıt bulunamadı."
                    }</p>
                    <button
                      onClick={leads.length === 0 ? () => setShowAddLead(true) : clearFilters}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700"
                    >
                      {leads.length === 0 ? "Yeni Kayıt" : "Filtreleri temizle"}
                    </button>
                  </Card>
                ) : (
                  filteredLeads.map(lead => {
                    const category = categories.find(c => c.label === lead.type);
                    const iconBg = category ? \`\${category.color}20\` : '#f1f5f9';
                    const iconColor = category ? category.color : '#64748b';
                    const hasPhone = typeof lead.phone === 'string' && lead.phone.trim().length > 3;

                    return (
                      <Card key={lead.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 shadow-sm hover:border-slate-300 transition-all cursor-pointer" onClick={() => onSelectLead(lead)}>
                        <div className="flex items-center gap-3 w-full md:w-1/3">
                          <div className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center font-bold text-lg" style={{ backgroundColor: iconBg, color: iconColor }}>
                            {lead.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-800 text-sm truncate">{lead.name}</h4>
                            <Badge className="mt-1 text-[10px] px-1.5 py-0 border-none bg-slate-100 text-slate-500 font-medium">{lead.type}</Badge>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:w-1/3 text-xs text-slate-500 gap-1">
                          <span className="flex items-center gap-1.5"><Globe size={12}/> {lead.district || '-'}</span>
                          <span className="flex items-center gap-1.5"><AlertTriangle size={12}/> Son: {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('tr-TR', {day:'numeric', month:'short', year:'numeric'}) : '-'}</span>
                        </div>

                        <div className="flex items-center justify-end gap-2 w-full md:w-auto" onClick={e => e.stopPropagation()}>
                          <Badge variant={
                            lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'warning' :
                            lead.temperature === 'cold' ? 'default' : 'success'
                          } className="mr-2">
                            {lead.status === 'Sıcak' || lead.temperature === 'hot' ? 'Sıcak' :
                             lead.temperature === 'cold' ? 'Soğuk' : 'Ilık'}
                          </Badge>
                          
                          {hasPhone ? (
                            <>
                              <button onClick={() => {
                                sessionStorage.setItem('trigger_call_form', 'true');
                                onSelectLead(lead);
                                window.location.href = \`tel:\${lead.phone}\`;
                              }} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50">
                                <Phone size={14} />
                              </button>
                              <a href={\`https://wa.me/\${lead.phone.replace(/\\D/g, '')}\`} target="_blank" rel="noreferrer" className="w-9 h-9 flex items-center justify-center rounded-lg border border-emerald-200 text-emerald-600 hover:bg-emerald-50">
                                <MessageSquare size={14} />
                              </a>
                            </>
                          ) : null}
                          <button onClick={() => onSelectLead(lead)} className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold tracking-widest leading-none">
                            ...
                          </button>
                        </div>
                      </Card>
                    );
                  })
                )}
              </div>
            </>
          )}

          {activeTab === 'araclar' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <Card className="p-4 md:p-6 bg-gradient-to-r from-blue-600 to-indigo-700 relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay border-[1px] border-dashed border-white" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                    <div className="flex items-start gap-4 text-white">
                      <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0 border border-white/20">
                        <Globe size={24} className="text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          Sahip Portalı Trafik Motoru
                          <div className="text-[9px] font-black bg-white/20 px-2 py-0.5 rounded tracking-widest border border-white/20 uppercase">OTOMASYON</div>
                        </h3>
                        <p className="text-xs text-blue-100 mt-1 font-medium max-w-sm leading-relaxed">
                          Müşterilerinize şeffaf rapor sunun.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {properties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {properties.map(prop => {
                      const traffic = getPropertyTraffic(prop.id);
                      return (
                        <Card key={prop.id} className="p-4 bg-white border-slate-100 shadow-sm hover:border-blue-200 transition-all group">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 pr-2">
                              <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{prop.title}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="text-[8px] bg-slate-100 text-slate-500 border-none">{prop.status}</Badge>
                                {traffic.views > 0 && <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1"><Zap size={8} /> {traffic.views} İzlenme</span>}
                              </div>
                            </div>
                            <button 
                              onClick={() => handleCreatePortal(prop.id)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"
                              title="Portal Linki Oluştur"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                          {traffic.lastView && (
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">
                              Son: {new Date(traffic.lastView).toLocaleDateString('tr-TR')}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-sm font-medium text-slate-500">Henüz hiç portföyünüz yok.</p>
                  </div>
                )}
                {portalLink && (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Portal Linki Hazır</span>
                    </div>
                    <div className="text-[10px] font-medium text-slate-600 break-all bg-white p-2 rounded-lg border border-emerald-100/50">
                      {portalLink}
                    </div>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <Card className="flex flex-col gap-4 border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                        <Users size={20} />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">Referral Motoru</h4>
                    </div>
                    <button 
                      onClick={() => setShowReferralInput(!showReferralInput)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 transition flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Plus size={14} /> Ekle
                    </button>
                  </div>
                  {showReferralInput && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Kişi Adı" 
                        value={newReferralName}
                        onChange={(e) => setNewReferralName(e.target.value)}
                        className="flex-1 p-2 text-sm rounded-lg border border-emerald-200 outline-none bg-white"
                      />
                      <button 
                        onClick={() => newReferralName.trim() && addReferralMutation.mutate(newReferralName)}
                        disabled={addReferralMutation.isPending}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold"
                      >
                        Ekle
                      </button>
                    </div>
                  )}
                  {referrals.length > 0 && (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {referrals.map((ref: Referral) => (
                        <div key={ref.id} className="bg-white p-2.5 rounded-lg border border-emerald-100 flex justify-between items-center text-sm shadow-sm">
                          <span className="font-medium text-slate-700">{ref.referred_name || 'İsimsiz'}</span>
                          <select 
                            className="text-xs p-1 rounded bg-emerald-50 border-none outline-none text-emerald-700 font-bold"
                            value={ref.status}
                            onChange={(e) => updateReferralMutation.mutate({ id: ref.id, status: e.target.value })}
                            disabled={updateReferralMutation.isPending}
                          >
                            <option value="İstendi">İstendi</option>
                            <option value="Alındı">Alındı</option>
                            <option value="Görüşmeye döndü">Görüşmeye Döndü</option>
                            <option value="Kapanış">Kapanış</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </section>
            </div>
          )}
        </div>

        {/* SAĞ KOLON (Desktop) */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Sadece Desktop Özeti */}
          <div className="hidden xl:block">
            {renderCRMSummary()}
          </div>

          {/* 9. Takip Uyarıları */}
          <Card className="border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 p-4 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><BellOff size={16} className="text-orange-500" /> Takip Uyarıları</h3>
              <button className="text-xs text-blue-600 font-medium" onClick={() => {setActiveTab('rehber'); setCrmSegment('silent');}}>Tümünü Gör</button>
            </div>
            <div className="divide-y divide-slate-100 bg-white">
              {silentLeadAlerts.slice(0, 3).map((alert, i) => {
                const l = leads.find(l => l.id === alert.lead_id);
                if (!l) return null;
                return (
                 <div key={i} className="p-4 flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-orange-500 mt-1 shrink-0 self-start" />
                   <div className="flex-1">
                     <p className="text-sm font-bold text-slate-800 line-clamp-1">{l.name}</p>
                     <p className="text-[11px] text-slate-500">{alert.message || 'Temas bekleniyor'}</p>
                   </div>
                   <Badge className="shrink-0 text-[10px] px-1.5 leading-tight py-0.5" variant="warning">Sıcak</Badge>
                 </div>
                )
              })}
              {silentLeadAlerts.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Şu an için takip uyarısı yok.
                </div>
              )}
            </div>
          </Card>

          {/* 10. AI CRM Özeti */}
          <Card className="border-purple-100 shadow-sm overflow-hidden">
            <div className="border-b border-purple-50 p-4 flex items-center justify-between bg-purple-50/30">
              <h3 className="font-bold text-purple-900 flex items-center gap-2 text-sm"><Sparkles size={16} className="text-purple-500"/> AI CRM Özeti</h3>
              <Badge className="bg-purple-100 text-purple-700 border-none text-[10px]">AI</Badge>
            </div>
            <div className="p-4 bg-white text-sm text-slate-600 prose prose-sm prose-purple max-h-64 overflow-auto">
              {(analyzeLeadsMutation.data && typeof analyzeLeadsMutation.data === 'string') ? (
                <div dangerouslySetInnerHTML={{ __html: analyzeLeadsMutation.data.replace(/\\*\\*([^\\*]+)\\*\\*/g, '<strong>$1</strong>').replace(/\\n/g, '<br/>') }} />
              ) : (
                <div className="text-center py-4 space-y-3">
                  <p className="text-xs text-slate-500">AI CRM özeti için AI Analiz'i çalıştır.</p>
                  <button 
                    onClick={() => { setIsAnalyzingLeads(true); analyzeLeadsMutation.mutate(leads); }}
                    disabled={isAnalyzingLeads || leads.length === 0}
                    className="mx-auto px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold hover:bg-purple-100"
                  >
                    AI Analiz
                  </button>
                </div>
              )}
            </div>
          </Card>

          {/* 11. Araçlar Kısayolları */}
          <Card className="border-slate-100 shadow-sm overflow-hidden bg-white p-4">
            <h3 className="font-bold text-slate-800 text-sm mb-4">Araçlar Kısayolları</h3>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setActiveTab('araclar')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition gap-2">
                <Globe size={20} className="text-emerald-600"/>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Sahip<br/>Portalı</span>
              </button>
              <button onClick={() => setActiveTab('araclar')} className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition gap-2">
                <Users size={20} className="text-orange-500"/>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Referral<br/>Motoru</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition gap-2">
                <Copy size={20} className="text-blue-500"/>
                <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">Kartvizit<br/>Tara</span>
              </button>
            </div>
          </Card>

        </div>
      </div>
    </motion.div>
  );
};
`;

const res = beforeReturn + newReturn;

fs.writeFileSync(path, res, 'utf8');
console.log("Updated CRMView");
