const fs = require('fs');

const path = 'src/components/RegionMap.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

// Find the destructured props and add addCategory
const propIndex = lines.findIndex(line => line.includes('categories,'));
if (propIndex !== -1) {
  lines.splice(propIndex + 1, 0, '  addCategory,');
}

// Find the start of the add pin modal
const startIdx = lines.findIndex(line => line.includes('{/* Add Pin Modal */}'));
const endIdx = lines.findIndex(line => line.includes('</AnimatePresence>') && line > startIdx);

const newModalCode = `      {/* Add Pin Modal */}
      <AnimatePresence>
        {showAddPin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center p-4 pointer-events-none pb-24 sm:pb-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl pointer-events-auto max-h-[85vh] overflow-y-auto flex flex-col gap-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-slate-900">Haritaya Ekle</h3>
                <button onClick={() => setShowAddPin(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                  <X size={20} />
                </button>
              </div>

              {/* KIND SELECTOR */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setNewPinData({...newPinData, kind: 'network_contact'})}
                  className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${(!newPinData.kind || newPinData.kind === 'network_contact') ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Network Teması
                </button>
                <button 
                  onClick={() => setNewPinData({...newPinData, kind: 'region_point'})}
                  className={\`flex-1 py-2 text-sm font-bold rounded-lg transition-all \${newPinData.kind === 'region_point' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}\`}
                >
                  Bölge Noktası
                </button>
              </div>

              <div className="space-y-4">
                {/* DYNAMIC FORM */}
                {(!newPinData.kind || newPinData.kind === 'network_contact') ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Kişi / İşletme Adı</label>
                        <input 
                          type="text" 
                          value={newPinData.title || ''}
                          onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                          placeholder="Örn: Ahmet Bakkal"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">İsim Soyisim</label>
                        <input 
                          type="text" 
                          value={newPinData.contact_name || ''}
                          onChange={(e) => setNewPinData({...newPinData, contact_name: e.target.value})}
                          placeholder="Örn: Ahmet Yılmaz"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Telefon</label>
                      <input 
                        type="tel" 
                        value={newPinData.phone || ''}
                        onChange={(e) => setNewPinData({...newPinData, phone: e.target.value})}
                        placeholder="Örn: 0555 555 55 55"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Nokta Adı</label>
                    <input 
                      type="text" 
                      value={newPinData.title || ''}
                      onChange={(e) => setNewPinData({...newPinData, title: e.target.value})}
                      placeholder="Örn: Yeni İnşaat Projesi"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex justify-between items-center">
                    Kategori
                    <button 
                      className="text-orange-500 hover:text-orange-600 lowercase"
                      onClick={() => {
                        const name = prompt("Yeni kategori adı:");
                        if (name) {
                          const isAutoCrm = confirm("CRM'e otomatik eklensin mi?");
                          const cColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];
                          const randomColor = cColors[Math.floor(Math.random() * cColors.length)];
                          if (addCategory) addCategory(name, randomColor, newPinData.kind || 'network_contact');
                          toast.success("Kategori eklendi, lütfen listeden seçin.");
                        }
                      }}
                    >
                      + Yeni
                    </button>
                  </label>
                  <select 
                    value={newPinData.type || ''}
                    onChange={(e) => setNewPinData({...newPinData, type: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="" disabled>Seçiniz</option>
                    {(categories || []).filter(c => c.kind === (newPinData.kind || 'network_contact') || !c.kind).map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                {(!newPinData.kind || newPinData.kind === 'network_contact') && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">İlişki Seviyesi</label>
                    <select 
                      value={newPinData.relationship_level || ''}
                      onChange={(e) => setNewPinData({...newPinData, relationship_level: e.target.value as any})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      <option value="" disabled>Seçiniz</option>
                      <option value="Soğuk Temas">Soğuk Temas</option>
                      <option value="Tanışıldı">Tanışıldı</option>
                      <option value="Güven Oluşuyor">Güven Oluşuyor</option>
                      <option value="Aktif Referans Kaynağı">Aktif Referans Kaynağı</option>
                      <option value="VIP Network">VIP Network</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {(!newPinData.kind || newPinData.kind === 'network_contact') ? (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Son Temas</label>
                        <input type="date" value={newPinData.last_contact_date || ''} onChange={(e) => setNewPinData({...newPinData, last_contact_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none" />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Gelecek Temas</label>
                        <input type="date" value={newPinData.next_contact_date || ''} onChange={(e) => setNewPinData({...newPinData, next_contact_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none" />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Takip Tarihi</label>
                      <input type="date" value={newPinData.followup_date || ''} onChange={(e) => setNewPinData({...newPinData, followup_date: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs outline-none" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Potansiyel</label>
                  <div className="flex gap-2">
                    {['Düşük', 'Orta', 'Yüksek', 'Sıcak'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setNewPinData({...newPinData, potential: lvl as any})}
                        className={\`flex-1 py-1.5 text-xs font-bold rounded-lg border \${newPinData.potential === lvl ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500 bg-white'}\`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Açık Adres / Konum</label>
                  <input 
                    type="text" 
                    value={newPinData.address || ''}
                    onChange={(e) => setNewPinData({...newPinData, address: e.target.value})}
                    placeholder="Örn: Atatürk Cad. No:12"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Notlar</label>
                  <textarea 
                    value={newPinData.notes || ''}
                    onChange={(e) => setNewPinData({...newPinData, notes: e.target.value})}
                    placeholder="Detaylı notlar..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none h-20"
                  />
                </div>

                <button 
                  onClick={handleAddPin}
                  disabled={!newPinData.title || !newPinData.type || addPinMutation.isPending}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
                >
                  {addPinMutation.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Ekle <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>`;

lines.splice(startIdx, endIdx - startIdx + 1, newModalCode);

fs.writeFileSync(path, lines.join('\\n'), 'utf8');
console.log('Done!');
