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
      className="pb-32"
    >
      <TokenUsageAlert />

      {isDayStarted && isDayEnded && (
        <Card className="p-6 bg-slate-50 border-slate-200 border-dashed mb-6">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* SOL KOLON (MAIN) */}
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
        
          {/* HERO CARD: Bugünü Netleştir */}
          <section>
            <Card className="p-6 md:p-8 bg-[#061A32] text-white border-none shadow-2xl relative overflow-hidden rounded-[28px] md:rounded-[32px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D2B4]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Sun className="text-[#00D2B4]" size={20} />
                    <span className="text-xs font-bold text-[#00D2B4] uppercase tracking-wider">
                      {todayStr}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-2">
                    Bugünü Netleştir
                  </h2>
                  <p className="text-sm text-slate-400 font-medium">
                    Planla, önceliklendir, ilerle ve günü güçlü kapat.
                  </p>

                  {!isDayStarted && !isDayEnded && (
                    <div className="mt-6 space-y-3">
                      <textarea
                        placeholder="Mikro hedefini yaz... (Örn: En kârlı 5 müşterime ulaşmak)"
                        value={microGoalInput}
                        onChange={(e) => setMicroGoalInput(e.target.value)}
                        className="w-full bg-[#071B34] border border-slate-700/50 rounded-xl p-3 text-white text-sm focus:border-[#00D2B4] outline-none transition-all placeholder:text-slate-500 min-h-[80px]"
                      />
                      <button
                        onClick={() => {
                          if (!microGoalInput.trim()) {
                            toast.error("Güne başlamak için mikro hedefini yaz.");
                            return;
                          }
                          addMicroGoalMutation.mutate(microGoalInput);
                          if (setShowDailyRadar) setShowDailyRadar(true);
                        }}
                        disabled={!microGoalInput.trim() || addMicroGoalMutation.isPending}
                        className="bg-[#00D2B4] hover:bg-[#00C8A5] text-[#061A32] px-6 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all w-full md:w-auto shadow-lg shadow-[#00D2B4]/20 disabled:opacity-50"
                      >
                        {addMicroGoalMutation.isPending ? "Kaydediliyor..." : "Günü Başlat"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Sağ Taraf - Stats */}
                <div className="flex sm:flex-col gap-4">
                  <div className="bg-[#071B34] border border-slate-700/50 p-4 rounded-2xl flex-1 flex flex-col justify-center">
                     <div className="flex items-center gap-2 mb-1.5">
                       <Zap size={14} className="text-[#FF6B1A]" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Günlük Streak</span>
                     </div>
                     <div className="text-xl font-bold text-white">
                        {gamifiedStats ? \`\${gamifiedStats.streak || 0} Gün\` : <Skeleton className="h-6 w-12 bg-slate-700" />}
                     </div>
                  </div>
                  <div className="bg-[#071B34] border border-slate-700/50 p-4 rounded-2xl flex-1 flex flex-col justify-center">
                     <div className="flex items-center gap-2 mb-1.5">
                       <Trophy size={14} className="text-[#00D2B4]" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XP Puanı</span>
                     </div>
                     <div className="text-xl font-bold text-white">
                        {gamifiedStats ? (gamifiedStats.points || 0).toLocaleString() : <Skeleton className="h-6 w-16 bg-slate-700" />}
                     </div>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {isDayStarted && !isDayEnded && (
            <>
              {/* BUGÜNÜN ÖNCELİKLERİ */}
              <section className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                      Bugünün Öncelikleri{" "}
                      <Target size={20} className="text-blue-500 fill-blue-500/20" />
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">Odaklanman gereken en önemli işler</p>
                  </div>
                </div>

                {visiblePriorities.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {visiblePriorities.map((item) => (
                      <Card key={item.id} className={\`p-4 bg-white border border-slate-100 shadow-sm transition-all flex flex-col gap-3 group hover:ring-1 hover:shadow-md rounded-[20px] \${item.ringClass}\`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={\`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mt-0.5 \${item.colorClass}\`}>
                              <item.icon size={24} />
                            </div>
                            <div className="min-w-0 flex-1 py-0.5">
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">
                                {item.subtitle}
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-0.5 break-words line-clamp-2">
                                {item.title}
                              </h4>
                            </div>
                          </div>

                          <div className="flex shrink-0 w-full sm:w-auto mt-1 sm:mt-0 justify-end">
                            {/* ACTION BUTTONS */}
                            {item.type === "gamified" && (
                              <button
                                onClick={() => !completeTaskMutation.isPending && completeTaskMutation.mutate({ task: item.originalItem })}
                                className="w-full sm:w-auto whitespace-nowrap bg-[#061A32] hover:bg-[#071B34] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center"
                              >
                                Tamamla (+\${item.originalItem.points}XP)
                              </button>
                            )}
                            {item.type === "daily" && (
                              <button
                                onClick={() => { /* ...existing logic */ api.updateTaskStatus(item.originalItem.id, true).then(() => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] }); toast.success("Görev başarıyla tamamlandı!"); }); }}
                                className="w-full sm:w-auto whitespace-nowrap bg-blue-50 hover:bg-blue-100 text-blue-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center"
                              >
                                Tamamla
                              </button>
                            )}
                            {item.type === "drip" && (
                              <button
                                onClick={() => { /* ...existing logic */ api.updateTaskStatus(item.originalItem.id, true).then(() => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] }); toast.success("Takip görevi başarıyla tamamlandı!"); }); }}
                                className="w-full sm:w-auto whitespace-nowrap bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center"
                              >
                                İletildi
                              </button>
                            )}
                            {item.type === "alert" && (
                              <button
                                onClick={() => { if (setSelectedLead && item.originalItem.lead && item.originalItem.lead.id) { setSelectedLead(item.originalItem.lead as Lead); } setActiveTab("crm"); }}
                                className="w-full sm:w-auto whitespace-nowrap bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center"
                              >
                                İncele
                              </button>
                            )}
                            {item.type === "smart_rec" && (
                              <button
                                onClick={() => { if (setSelectedProperty) { setSelectedProperty(item.originalItem); } setActiveTab("portfoyler"); }}
                                className="w-full sm:w-auto whitespace-nowrap bg-amber-50 hover:bg-amber-100 text-amber-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center"
                              >
                                Düzenle
                              </button>
                            )}
                            {item.type === "bolgem_followup" && (
                              <div className="flex gap-2 shrink-0 w-full sm:w-auto">
                                <button onClick={() => { setActiveTab("bolgem"); }} className="flex-1 sm:flex-none whitespace-nowrap bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center">
                                  Bölgem'de Aç
                                </button>
                                <button onClick={() => { api.updateTaskStatus(item.originalItem.id, true).then(() => { queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TASKS, profile?.id] }); toast.success("Bölge takibi işaretlendi!"); }); }} className="flex-1 sm:flex-none whitespace-nowrap bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm text-center">
                                  Tamamlandı
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {item.desc && (
                          <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-xl italic font-medium leading-relaxed">
                            {item.desc}
                          </div>
                        )}
                      </Card>
                    ))}

                    {todaysPriorities.length > 5 && (
                      <div className="flex gap-2 pt-1">
                        {todaysPriorities.length > visiblePriorityCount && (
                          <button
                            onClick={() => setVisiblePriorityCount((prev) => Math.min(prev + 5, todaysPriorities.length))}
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold transition-colors shadow-sm border border-slate-200"
                          >
                            {Math.min(5, todaysPriorities.length - visiblePriorityCount)} öncelik daha göster
                          </button>
                        )}
                        {visiblePriorityCount > 5 && (
                          <button
                            onClick={() => setVisiblePriorityCount(5)}
                            className="flex-1 bg-white hover:bg-slate-50 text-slate-600 px-4 py-3 rounded-xl text-xs font-bold transition-colors shadow-sm border border-slate-200"
                          >
                            Daha az göster
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-[#00D2B4]/10 border border-[#00D2B4]/20 rounded-[24px] text-center">
                    <div className="w-12 h-12 bg-[#00D2B4]/20 text-[#00D2B4] rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Mükemmel Gidiyorsun!
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Günün önceliklerini tamamladın.
                    </p>
                  </div>
                )}
              </section>

              {/* MİKRO HEDEF */}
              {(activeMicroGoal || microGoalInput.trim()) && (
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex items-center gap-4 mt-4 mb-2">
                  <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
                    <Target size={24} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest mb-0.5">
                      MİKRO HEDEF
                    </h3>
                    <p className="text-sm text-indigo-700 font-bold">
                      {activeMicroGoal?.title || microGoalInput}
                    </p>
                  </div>
                </div>
              )}

              {/* GÜNLÜK PLAN GÖSTERGELERİ */}
              {dailyPlan && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200 rounded-[20px] p-4 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Arama
                    </div>
                    <div className="text-xl font-bold text-[#061A32]">
                      {dailyPlan.completed_calls}/{dailyPlan.planned_calls}
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: \`\${Math.min(100, (dailyPlan.completed_calls / (dailyPlan.planned_calls || 1)) * 100)}%\` }} />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[20px] p-4 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Takip
                    </div>
                    <div className="text-xl font-bold text-[#061A32]">
                      {dailyPlan.completed_followups}/{dailyPlan.planned_followups}
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: \`\${Math.min(100, (dailyPlan.completed_followups / (dailyPlan.planned_followups || 1)) * 100)}%\` }} />
                    </div>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[20px] p-4 text-center shadow-sm">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Portföy
                    </div>
                    <div className="text-xl font-bold text-[#061A32]">
                      {dailyPlan.completed_portfolio_actions}/{dailyPlan.planned_portfolio_actions}
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                      <div className="h-full bg-[#00D2B4] rounded-full" style={{ width: \`\${Math.min(100, (dailyPlan.completed_portfolio_actions / (dailyPlan.planned_portfolio_actions || 1)) * 100)}%\` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* AKIŞ NOTLARI */}
              {flowNotes.length > 0 && (
                <section className="pt-2">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div>
                      <h3 className="text-sm font-bold text-[#061A32] flex items-center gap-2">
                        <StickyNote size={16} className="text-amber-500" /> Akış Notları
                      </h3>
                    </div>
                    {setActiveTab && (
                      <button
                        onClick={() => setActiveTab("tasks")}
                        className="text-[10px] font-bold text-[#061A32]/70 hover:text-[#061A32] bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Tümünü Gör
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {flowNotes.map((note) => (
                      <Card
                        key={note.id}
                        className="p-4 bg-amber-50 border border-amber-100/50 shadow-sm rounded-[20px] flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2 gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate min-w-0">
                              {note.title}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-white/60 text-slate-600">
                              {note.sourceLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3 overflow-hidden break-words">
                            {note.notes}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {dayClosure && (
                <Card className="p-4 bg-emerald-50 border-emerald-100 mt-4 rounded-[20px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <Trophy size={18} className="text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">Günün Özeti Hazır</h4>
                      <p className="text-[10px] text-emerald-700 font-medium">
                        "{dayClosure.wins?.slice(0, 50)}..."
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {/* RESCUE CONDITION */}
              {(() => {
                const currentHour = new Date().getHours();
                const isLowProgress = (gamifiedStats?.daily_progress || 0) < 40;
                const canRescue = isLowProgress && currentHour >= 16 && !rescueSession;
                if (!canRescue) return null;

                return (
                  <Card className="bg-[#FF6B1A]/10 border-[#FF6B1A]/20 p-6 relative overflow-hidden mt-8 rounded-[24px]">
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#FF6B1A]/20 rounded-2xl flex items-center justify-center text-[#FF6B1A] shadow-sm">
                          <Zap size={24} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Günü Kurtarma Zamanı!</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            Günü %100 verimle kapatmak için hala vaktin var.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => startRescueMutation.mutate()}
                        disabled={startRescueMutation.isPending}
                        className="px-5 py-2.5 bg-[#FF6B1A] text-white rounded-xl text-xs font-bold shadow-lg shadow-[#FF6B1A]/30 active:scale-95 transition-all"
                      >
                        {startRescueMutation.isPending ? "Hazırlanıyor..." : "Başlat"}
                      </button>
                    </div>
                  </Card>
                );
              })()}

              {/* GÜNÜ KAPAT */}
              <section className="pt-4">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDayCloser(true)}
                  className="w-full bg-[#061A32] text-white p-6 md:p-8 rounded-[28px] md:rounded-[32px] flex items-center justify-between group shadow-xl relative overflow-hidden"
                >
                  <div className="relative z-10 flex items-center gap-4 md:gap-6">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-[#00D2B4] group-hover:scale-110 transition-transform">
                      <Moon size={28} />
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xl text-white">Günü Kapat</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium">
                        Bugünkü performansını mühürle ve serini koru.
                      </p>
                    </div>
                  </div>
                  <div className="relative z-10 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-[#00D2B4] group-hover:text-[#061A32] transition-colors">
                    <ArrowRight size={24} />
                  </div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-[#00D2B4]/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none" />
                </motion.button>
              </section>
            </>
          )}

        </div>

        {/* SAĞ KOLON (WIDGETS: AI İçgörü, Gelir Özeti vs.) */}
        <div className="xl:col-span-1 space-y-6 md:space-y-8 flex flex-col">
          
          {/* AI KOÇ KART (AI İçgörü) */}
          <section>
            <Card
              onClick={() => {
                if (!canUseAiCoach) {
                  setShowUpgradeModal(true);
                } else {
                  setActiveTab("koc");
                }
              }}
              className="p-5 md:p-6 bg-white border border-slate-200 overflow-hidden relative shadow-sm cursor-pointer group rounded-[24px]"
            >
              <div className="relative z-10 flex flex-col gap-4">
                
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-indigo-600">
                     <Brain size={18} />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                       AI İçgörü
                     </span>
                   </div>
                   {!canUseAiCoach && (
                     <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-slate-500 transition-colors">
                       <Lock size={10} />
                       <span className="text-[8px] uppercase font-bold tracking-wider">Kilitli</span>
                     </div>
                   )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="relative w-16 h-16 shrink-0">
                    {/* Momentum Çarkı - Updated Colors */}
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100 stroke-current"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={\`\${gamifiedStats?.momentum && gamifiedStats.momentum < 40 ? "text-red-500" : gamifiedStats?.momentum && gamifiedStats.momentum < 70 ? "text-amber-500" : "text-[#00D2B4]"} stroke-current\`}
                        strokeWidth="3"
                        strokeDasharray={\`\${gamifiedStats?.momentum || 0}, 100\`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pt-1">
                      <span className="text-xl font-black text-[#061A32]">
                        {gamifiedStats?.momentum || 0}
                      </span>
                      <span className="text-[8px] uppercase font-bold text-slate-400 -mt-1">
                        Momentum
                      </span>
                    </div>
                  </div>

                  <div className="relative flex-1">
                    {canUseAiCoach ? (
                      <div className="text-sm font-semibold leading-relaxed text-[#061A32] italic line-clamp-3">
                        {coachInsights?.daily_tip ? (
                          \`"\${coachInsights.daily_tip}"\`
                        ) : (
                          <Skeleton className="h-4 w-full bg-slate-200" />
                        )}
                      </div>
                    ) : (
                      <div className="text-sm font-semibold leading-relaxed text-slate-400 italic blur-[3px] select-none line-clamp-3">
                        Yapay zeka asistanınız bugün kime odaklanmanız gerektiğini analiz etti.
                      </div>
                    )}

                    {!canUseAiCoach && (
                      <div className="absolute inset-0 flex items-center justify-start">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF6B1A] bg-[#FF6B1A]/10 px-3 py-1.5 rounded-lg">
                          Planı Yükselt
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </Card>
          </section>

          {/* GELİR ÖZETİ & PIPELINE */}
          <section className="space-y-6">
            <h3 className="text-sm font-bold text-[#061A32] px-1">Gelir Özeti</h3>
            {revenueLoading && !revenueStats ? (
              <div className="flex justify-center py-10 bg-slate-50 border border-slate-200 rounded-[24px]">
                <RefreshCw className="animate-spin text-slate-400" size={24} />
              </div>
            ) : revenueStats ? (
              <div className="space-y-6">
                <RevenueOverview stats={revenueStats} />
                <PipelineFunnel properties={properties} />
              </div>
            ) : (
              <Card className="p-8 text-center bg-white rounded-[24px]">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Target size={24} className="text-slate-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Henüz Veri Yok
                </h3>
                <p className="text-slate-500 text-xs mt-2">
                  Satış ve gelirlerinizi takip etmek için CRM kullanın.
                </p>
              </Card>
            )}
          </section>

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
console.log("Replaced returns");
