const fs = require('fs');

const path = 'src/components/DashboardView.tsx';
let source = fs.readFileSync(path, 'utf8');

const returnStatementIndex = source.indexOf('  return (\n    <motion.div');
if (returnStatementIndex === -1) {
  console.log("Could not find return statement");
  process.exit(1);
}

const beforeReturn = source.substring(0, returnStatementIndex);

const newReturn = `  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-[calc(2rem+env(safe-area-inset-bottom))] lg:pb-8"
    >
      <TokenUsageAlert />

      {isDayStarted && isDayEnded && (
        <Card className="p-5 md:p-6 bg-slate-50 border-slate-200 border-dashed mb-6 rounded-[24px]">
          <div className="flex items-center gap-4 text-slate-500">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold">Bugün Başarıyla Tamamlandı</h3>
              <p className="text-[10px] font-medium uppercase tracking-wider">
                İyi dinlenmeler şampiyon!
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* SOL KOLON (MAIN) */}
        <div className="lg:col-span-2 space-y-6 md:space-y-6">
        
          {/* HERO CARD: Bugünü Netleştir */}
          <section>
            <Card className="p-5 md:p-7 bg-[#061A32] text-white border-none shadow-2xl relative overflow-hidden rounded-[28px] flex flex-col md:flex-row justify-between gap-6 md:items-center">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2B4]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 flex-1">
                <div className="flex items-center justify-between md:justify-start gap-4 mb-2">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    Bugünü Netleştir
                  </h2>
                  <div className="flex items-center gap-1.5 md:absolute md:top-0 md:right-0">
                    <Calendar size={14} className="text-white/60" />
                    <span className="text-xs font-bold text-white/80">{todayStr}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 font-medium max-w-sm mb-6">
                  Planla, önceliklendir, ilerle ve günü güçlü kapat.
                </p>

                {!isDayStarted && !isDayEnded && (
                  <button
                    onClick={() => {
                      addMicroGoalMutation.mutate("Güne başla");
                      if (setShowDailyRadar) setShowDailyRadar(true);
                    }}
                    disabled={addMicroGoalMutation.isPending}
                    className="bg-white hover:bg-slate-50 text-[#FF6B1A] px-8 h-12 rounded-xl text-sm font-bold active:scale-95 transition-all w-full md:w-auto shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                  >
                    <Play size={18} className="fill-current group-hover:scale-110 transition-transform" />
                    {addMicroGoalMutation.isPending ? "Kaydediliyor..." : "Günü Başlat"}
                  </button>
                )}
              </div>

              {/* Sağ Taraf - Stats (Kendi Bordo Kutusunda) */}
              <div className="relative z-10 flex gap-4 md:gap-8 bg-[#092342] p-4 md:p-6 rounded-2xl border border-white/5 w-full md:w-auto">
                <div className="flex-1 md:flex-none">
                  <div className="flex items-center gap-1.5 mb-1 text-[#FF6B1A]">
                    <Zap size={14} className="fill-current" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF6B1A]">Günlük Streak</span>
                  </div>
                  <div>
                    <span className="text-3xl font-black">{gamifiedStats ? gamifiedStats.streak || 0 : 0}</span>
                    <span className="text-sm font-bold ml-1 text-white/80">gün</span>
                  </div>
                  <div className="text-[10px] text-[#00D2B4] font-bold mt-1">Harika gidiyorsun!</div>
                </div>
                <div className="w-px bg-white/10 shrink-0" />
                <div className="flex-1 md:flex-none">
                  <div className="flex items-center gap-1.5 mb-1 text-amber-400">
                    <Star size={14} className="stroke-[2.5]" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">XP Puanı</span>
                  </div>
                  <div>
                    <span className="text-3xl font-black">{gamifiedStats ? (gamifiedStats.points || 0).toLocaleString() : 0}</span>
                    <span className="text-sm font-medium text-white/50 ml-1">/ 2.000</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#00D2B4] rounded-full" style={{ width: \`\${Math.min(100, ((gamifiedStats?.points || 0) / 2000) * 100)}%\` }} />
                  </div>
                  <div className="text-[9px] text-white/50 mt-1">Bir sonraki ödüle {Math.max(0, 2000 - (gamifiedStats?.points || 0))} XP kaldı</div>
                </div>
              </div>
            </Card>
          </section>

          {isDayStarted && !isDayEnded && (
            <>
              {/* 1. BUGÜNÜN ÖNCELİKLERİ */}
              <section>
                <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">1</div>
                      <h3 className="text-base font-bold text-slate-900">Bugünün Öncelikleri</h3>
                    </div>
                    {setActiveTab && (
                      <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors flex items-center">
                        Tümünü gör <ArrowRight size={14} className="ml-1" />
                      </button>
                    )}
                  </div>

                  {visiblePriorities.length > 0 ? (
                    <div className="space-y-3">
                      {visiblePriorities.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100 group">
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <div className={\`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 \${item.colorClass}\`}>
                              <item.icon size={20} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 truncate">
                                {item.title}
                              </h4>
                              <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                                {item.desc || item.subtitle}
                              </p>
                            </div>
                          </div>
                          
                          <div className="shrink-0 flex items-center gap-3">
                             <div className={\`px-2 py-1 text-[10px] font-bold rounded \${item.type === "gamified" ? "bg-amber-100 text-amber-700" : item.type === "daily" ? "bg-emerald-100 text-emerald-700" : item.type === "alert" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}\`}>
                               {item.type === "gamified" ? "Bekliyor" : item.type === "daily" ? "Planlandı" : item.type === "alert" ? "Kritik" : "Taslak"}
                             </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-slate-500 text-sm">Bugün için bekleyen öncelik yok.</div>
                  )}
                </Card>
              </section>

              {/* 2. MİKRO HEDEF */}
              <section>
                 <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">2</div>
                        <h3 className="text-base font-bold text-slate-900">Mikro Hedef</h3>
                      </div>
                      <button className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 border border-slate-200 px-3 py-1.5 rounded-lg">
                        <Edit3 size={12} /> Düzenle
                      </button>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Target size={24} className="text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 mb-0.5 truncate">{activeMicroGoal?.title || "Bugün 5 nitelikli görüşme yapacağım"}</h4>
                        <p className="text-xs text-slate-500 mb-3 truncate">Nitelikli lead bağlantısı</p>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                             <div className="h-full bg-[#00D2B4]" style={{ width: '60%' }} />
                          </div>
                          <span className="text-xs font-bold text-slate-600 shrink-0">3 / 5</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-3 text-slate-400">
                      <Clock size={12} />
                      <span className="text-[10px] font-medium">Günün bitmesine <strong className="font-bold">6sa 48dk</strong> kaldı</span>
                    </div>
                 </Card>
              </section>

              {/* 3. GÜNÜN NOTLARI / AKIŞ NOTLARI */}
              <section>
                 <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">3</div>
                        <h3 className="text-base font-bold text-slate-900">Günün Notları / Akış Notları</h3>
                      </div>
                      {setActiveTab && (
                         <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center">
                           Tümünü gör <ArrowRight size={14} className="ml-1" />
                         </button>
                      )}
                    </div>

                    <div className="space-y-3">
                       {flowNotes.length > 0 ? flowNotes.slice(0,3).map(note => (
                         <div key={note.id} className="flex gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 items-start">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                              {note.sourceLabel}
                            </span>
                            <div className="flex-1 text-sm font-medium text-slate-700 leading-snug line-clamp-2">
                              {note.notes}
                            </div>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">09:15</span>
                         </div>
                       )) : (
                         <div className="py-4 text-center text-slate-500 text-sm">Akışa eklenen not yok.</div>
                       )}
                    </div>
                 </Card>
              </section>

              {/* 4. GÜNLÜK PLAN GÖSTERGELERİ */}
              <section>
                 <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">4</div>
                      <h3 className="text-base font-bold text-slate-900">Günlük Plan Göstergeleri</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                      <div className="border-r border-slate-100 md:border-r-slate-100 pr-4 last:border-0 last:pr-0">
                         <div className="flex items-center gap-1.5 text-emerald-500 mb-2">
                           <Phone size={16} />
                           <span className="text-xs font-bold text-slate-600">Arama</span>
                         </div>
                         <div className="flex justify-between items-end mb-2">
                            <div className="text-2xl font-black text-slate-900 leading-none">8<span className="text-sm text-slate-400 font-medium ml-1">/ 15</span></div>
                            <span className="text-[10px] font-bold text-slate-400">%53</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{width: '53%'}} />
                         </div>
                      </div>
                      
                      <div className="border-r-0 md:border-r border-slate-100 pr-4 md:pl-0">
                         <div className="flex items-center gap-1.5 text-orange-500 mb-2">
                           <UserCheck size={16} />
                           <span className="text-xs font-bold text-slate-600">Takip</span>
                         </div>
                         <div className="flex justify-between items-end mb-2">
                            <div className="text-2xl font-black text-slate-900 leading-none">6<span className="text-sm text-slate-400 font-medium ml-1">/ 10</span></div>
                            <span className="text-[10px] font-bold text-slate-400">%60</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{width: '60%'}} />
                         </div>
                      </div>

                      <div className="border-r border-slate-100 md:border-r-slate-100 pr-4">
                         <div className="flex items-center gap-1.5 text-blue-500 mb-2">
                           <Calendar size={16} />
                           <span className="text-xs font-bold text-slate-600">Ziyaret</span>
                         </div>
                         <div className="flex justify-between items-end mb-2">
                            <div className="text-2xl font-black text-slate-900 leading-none">2<span className="text-sm text-slate-400 font-medium ml-1">/ 5</span></div>
                            <span className="text-[10px] font-bold text-slate-400">%40</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{width: '40%'}} />
                         </div>
                      </div>

                      <div className="">
                         <div className="flex items-center gap-1.5 text-indigo-500 mb-2">
                           <CheckSquare size={16} />
                           <span className="text-xs font-bold text-slate-600">Teklif</span>
                         </div>
                         <div className="flex justify-between items-end mb-2">
                            <div className="text-2xl font-black text-slate-900 leading-none">1<span className="text-sm text-slate-400 font-medium ml-1">/ 3</span></div>
                            <span className="text-[10px] font-bold text-slate-400">%33</span>
                         </div>
                         <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{width: '33%'}} />
                         </div>
                      </div>
                    </div>
                 </Card>
              </section>

              {/* 5. RESCUE */}
              <section>
                 <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-[24px]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[11px] font-bold">5</div>
                      <h3 className="text-base font-bold text-slate-900">Rescue / Günün Özeti</h3>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center">
                       <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                         <LifeBuoy size={24} />
                       </div>
                       <div className="flex-1 text-center md:text-left">
                          <p className="text-sm font-bold text-slate-900">Planın gerisindesin. <span className="text-orange-600">2 aksiyonda gecikme var.</span></p>
                          <p className="text-xs text-slate-500 mt-0.5">Önceliklerini sadeleştir, en yüksek etkili 1 aksiyona odaklan.</p>
                       </div>
                       <div className="flex flex-wrap gap-2 w-full md:w-auto mt-2 md:mt-0 justify-center">
                          <button className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 flex-1 md:flex-none justify-center">
                            <RefreshCw size={14} /> Öncelikleri Yeniden Sırala
                          </button>
                          <button className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-100 transition-colors flex items-center gap-1.5 flex-1 md:flex-none justify-center">
                            <Clock size={14} /> Gecikenleri Ertele
                          </button>
                          <button onClick={() => startRescueMutation.mutate()} className="text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors flex items-center gap-1.5 w-full md:w-auto justify-center mt-2 md:mt-0">
                            <Zap size={14} className="fill-current" /> Odaklanma Modu
                          </button>
                       </div>
                    </div>
                 </Card>
              </section>

              {/* GÜNÜ KAPAT */}
              <section className="pt-2">
                 <Card className="p-5 md:p-6 bg-white border border-slate-100 shadow-sm rounded-[28px] md:rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4 text-center md:text-left">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center shrink-0 mx-auto md:mx-0">
                        <Moon size={28} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-slate-900">Günü Kapat</h4>
                        <p className="text-xs text-slate-500 font-medium">Bugünkü ilerlemeni kaydet, kazanımlarını not al ve yarına hazır ol.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                       <button className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors whitespace-nowrap text-center">
                         Taslak Olarak Kaydet
                       </button>
                       <button onClick={() => setShowDayCloser(true)} className="flex-1 md:flex-none px-6 py-3 rounded-xl bg-[#061A32] text-white font-bold text-sm flex items-center gap-2 hover:bg-[#082B55] transition-colors whitespace-nowrap justify-center">
                         <CheckCircle2 size={18} /> Günü Kapat
                       </button>
                    </div>
                 </Card>
              </section>
            </>
          )}

        </div>

        {/* SAĞ KOLON (WIDGETS: AI İçgörü, Gelir Özeti vs.) */}
        <div className="lg:col-span-1 space-y-6 md:space-y-6 flex flex-col mt-4 lg:mt-0">
          
          {/* Aksiyon Merkezi */}
          <Card className="p-5 bg-white border border-slate-100 shadow-sm rounded-[24px]">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <Target size={18} className="text-slate-700" />
                 <h3 className="text-sm font-bold text-slate-900">Aksiyon Merkezi</h3>
               </div>
               <div className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">5</div>
             </div>
             
             <div className="space-y-3">
               <div className="flex items-center justify-between text-sm py-1 cursor-pointer group">
                  <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-slate-900 transition-colors">
                     <Phone size={16} className="text-emerald-500" /> Cevapsız / Geri Dönüş Bekleyen
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">3</span>
                     <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
               </div>
               <div className="w-full h-px bg-slate-50 border-b border-dashed border-slate-100" />

               <div className="flex items-center justify-between text-sm py-1 cursor-pointer group">
                  <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-slate-900 transition-colors">
                     <Mail size={16} className="text-blue-500" /> Yeni Lead'ler
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">2</span>
                     <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
               </div>
               <div className="w-full h-px bg-slate-50 border-b border-dashed border-slate-100" />

               <div className="flex items-center justify-between text-sm py-1 cursor-pointer group">
                  <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-slate-900 transition-colors">
                     <Home size={16} className="text-indigo-500" /> Fiyat Revizyonu Önerileri
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">4</span>
                     <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
               </div>
               <div className="w-full h-px bg-slate-50 border-b border-dashed border-slate-100" />
               
               <div className="flex items-center justify-between text-sm py-1 cursor-pointer group">
                  <div className="flex items-center gap-2.5 text-slate-600 group-hover:text-slate-900 transition-colors">
                     <MapPin size={16} className="text-emerald-500" /> Bölge Takip Hatırlatmaları
                  </div>
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">2</span>
                     <ChevronRight size={14} className="text-slate-400 group-hover:text-slate-600" />
                  </div>
               </div>
             </div>
             
             <button onClick={() => setActiveTab && setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-4 flex items-center">
               Tüm aksiyonları gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>

          {/* Gelir Özeti (White style) */}
          <Card className="p-5 bg-white border border-slate-100 shadow-sm rounded-[24px]">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-900">Gelir Özeti</h3>
               <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 outline-none">
                 <option>Bu Ay</option>
               </select>
             </div>
             <div>
                <div className="flex items-end gap-3 mb-1">
                  <span className="text-3xl font-black text-slate-900 leading-none">1.250.000 <span className="text-2xl">₺</span></span>
                  <span className="text-xs font-bold text-emerald-500 flex items-center mb-1"><ArrowUpRight size={12} /> %18</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wide">Toplam Potansiyel Gelir</span>
                  <span className="text-[10px] text-slate-400">Geçen aya göre</span>
                </div>
             </div>

             <div className="mt-6 space-y-4">
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">Potansiyel</span>
                     <span className="text-slate-900">3.200.000 ₺</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-slate-800" style={{width: '90%'}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">Görüşme</span>
                     <span className="text-slate-900">1.850.000 ₺</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-[#00D2B4]" style={{width: '60%'}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">Teklif</span>
                     <span className="text-slate-900">950.000 ₺</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-[#FF6B1A]" style={{width: '40%'}}></div>
                   </div>
                </div>
                <div>
                   <div className="flex justify-between text-xs font-bold mb-1.5">
                     <span className="text-slate-600">Kapanan</span>
                     <span className="text-slate-900">1.250.000 ₺</span>
                   </div>
                   <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500" style={{width: '30%'}}></div>
                   </div>
                </div>
             </div>

             <button onClick={() => setActiveTab && setActiveTab("crm")} className="text-xs font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-5 flex items-center">
               Funnel'ı detaylı gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>

          {/* AI KOÇ KART (AI İçgörü) */}
          <Card
            onClick={() => {
              if (!canUseAiCoach) {
                setShowUpgradeModal(true);
              } else {
                setActiveTab && setActiveTab("koc");
              }
            }}
            className="p-5 bg-white border border-slate-100 shadow-sm rounded-[24px] cursor-pointer group flex flex-col"
          >
             <div className="flex items-center gap-2 mb-4">
               <Brain size={18} className="text-slate-700" />
               <h3 className="text-sm font-bold text-slate-900">AI İçgörü</h3>
             </div>
             <div className="flex flex-col gap-4 flex-1">
                <p className="text-sm text-slate-600 leading-relaxed italic font-medium">
                  {canUseAiCoach ? coachInsights?.daily_tip || "Nida Kule 24 no'lu daire için fiyatı %2 artırman, 14 gün içinde 2 kat daha fazla talep getirebilir." : "Yapay zeka asistanınız bugün kime odaklanmanız gerektiğini analiz etti."}
                </p>
                <div className="flex items-center gap-2 mt-auto">
                   <span className="text-xs font-bold text-slate-500">Talep artış olasılığı:</span>
                   <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1"><ArrowUpRight size={10} /> Yüksek</span>
                </div>
             </div>
             
             <button className="text-xs font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-4 flex items-center">
               Tüm içgörüleri gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>

          {/* Haftalık Momentum */}
          <Card className="p-5 bg-white border border-slate-100 shadow-sm rounded-[24px]">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <BarChart3 size={18} className="text-slate-700" />
                 <h3 className="text-sm font-bold text-slate-900">Haftalık Momentum</h3>
               </div>
               <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-600 outline-none">
                 <option>Bu Hafta</option>
               </select>
             </div>
             
             <div className="flex gap-4 items-end mt-6">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-100 stroke-current"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#00D2B4] stroke-current"
                      strokeWidth="3"
                      strokeDasharray="78, 100"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                    <span className="text-2xl font-black text-slate-900">78%</span>
                    <span className="text-[7px] uppercase font-bold text-slate-400">Momentum Skoru</span>
                  </div>
                </div>

                <div className="flex-1 flex items-end justify-between h-16 w-full px-2 border-b border-dashed border-slate-200 relative pb-1">
                   <div className="absolute top-0 right-0 left-0 border-t border-dashed border-[#00D2B4]/50 pointer-events-none">
                     <span className="absolute -top-4 right-0 text-[9px] font-bold text-[#00D2B4]">Hedef 85%</span>
                   </div>
                   <div className="w-2.5 h-[30%] bg-slate-200 rounded-t-sm" />
                   <div className="w-2.5 h-[60%] bg-slate-200 rounded-t-sm" />
                   <div className="w-2.5 h-[80%] bg-slate-200 rounded-t-sm" />
                   <div className="w-2.5 h-[100%] bg-[#00D2B4] rounded-t-sm" />
                   <div className="w-2.5 h-[50%] bg-slate-200 rounded-t-sm" />
                   <div className="w-2.5 h-[40%] bg-slate-200 rounded-t-sm" />
                   <div className="w-2.5 h-[20%] bg-slate-200 rounded-t-sm" />
                </div>
             </div>
             
             <div className="flex justify-between pl-28 pr-2 mt-1">
                <span className="text-[9px] font-bold text-slate-400">Pzt</span>
                <span className="text-[9px] font-bold text-slate-400">Sal</span>
                <span className="text-[9px] font-bold text-slate-400">Çar</span>
                <span className="text-[9px] font-bold text-slate-400">Per</span>
                <span className="text-[9px] font-bold text-slate-400">Cum</span>
                <span className="text-[9px] font-bold text-slate-400">Cmt</span>
                <span className="text-[9px] font-bold text-slate-400">Paz</span>
             </div>

             <button className="text-xs font-bold text-blue-600 hover:text-blue-700 w-full text-left mt-4 flex items-center">
               Detaylı analizi gör <ArrowRight size={14} className="ml-1" />
             </button>
          </Card>

        </div>
      </div>
      
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onSelectPlan={(tier) => console.log("Plan seçildi:", tier)}
        onActivateTrial={async () => {
          try {
            await subscribe("trial");
            setShowUpgradeModal(false);
          } catch (e) {
            console.error("Deneme sürümü başlatılırken hata:", e);
          }
        }}
      />
    </motion.div>
  );
};`;

source = beforeReturn + newReturn;

fs.writeFileSync(path, source, 'utf8');
console.log("Updated DashboardView returns");
