const https = require('https');

// TDK API'si test fonksiyonu - Optimize edilmiş
async function testTDKAPI(kelime) {
    try {
        const tdkUrl = `https://sozluk.gov.tr/gts?ara=${encodeURIComponent(kelime)}`;

        return new Promise((resolve, reject) => {
            const request = https.get(tdkUrl, (res) => {
                let data = '';

                res.on('data', (chunk) => {
                    data += chunk;
                });

                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        if (response && response.length > 0) {
                            console.log(`✅ TDK API: "${kelime}" kelimesi bulundu`);
                            resolve(true);
                        } else {
                            console.log(`❌ TDK API: "${kelime}" kelimesi bulunamadı`);
                            resolve(false);
                        }
                    } catch (error) {
                        console.log(`❌ TDK API: "${kelime}" için JSON parse hatası`);
                        resolve(false);
                    }
                });
            });
            
            // Timeout ekle (5 saniye)
            request.setTimeout(5000, () => {
                console.log(`⏰ TDK API: "${kelime}" için timeout`);
                request.destroy();
                resolve(false);
            });
            
            request.on('error', (error) => {
                console.error(`❌ TDK API hatası: ${error.message}`);
                resolve(false);
            });
        });
    } catch (error) {
        console.error('TDK API test hatası:', error);
        return false;
    }
}

// Wiktionary API test fonksiyonu
async function testWiktionaryAPI(kelime) {
    try {
        const url = `https://tr.wiktionary.org/api/rest_v1/page/summary/${encodeURIComponent(kelime)}`;
        
        return new Promise((resolve, reject) => {
            https.get(url, (res) => {
                if (res.statusCode === 200) {
                    console.log(`✅ Wiktionary API: "${kelime}" kelimesi bulundu`);
                    resolve(true);
                } else {
                    console.log(`❌ Wiktionary API: "${kelime}" kelimesi bulunamadı (Status: ${res.statusCode})`);
                    resolve(false);
                }
            }).on('error', (error) => {
                console.error(`❌ Wiktionary API hatası: ${error.message}`);
                resolve(false);
            });
        });
    } catch (error) {
        console.error('Wiktionary API test hatası:', error);
        return false;
    }
}

// Test kelimeleri
const testKelimeler = [
    'elma', 'bilgisayar', 'programlama', 'yazılım', 'teknoloji',
    'internet', 'uygulama', 'oyun', 'film', 'müzik',
    'spor', 'futbol', 'basketbol', 'tenis', 'yüzme',
    'koşu', 'jimnastik', 'atletizm', 'güreş', 'yemek',
    'kahvaltı', 'öğle', 'akşam', 'çorba', 'pilav',
    'et', 'tavuk', 'balık', 'sebze', 'meyve',
    'tatlı', 'çikolata', 'dondurma', 'pasta', 'kurabiye',
    'börek', 'poğaça', 'simit', 'ekmek', 'içecek',
    'su', 'çay', 'kahve', 'süt', 'meyve suyu',
    'limonata', 'kola', 'ayran', 'şerbet', 'renk',
    'kırmızı', 'mavi', 'yeşil', 'sarı', 'turuncu',
    'mor', 'pembe', 'kahverengi', 'siyah', 'beyaz',
    'gri', 'lacivert', 'turkuaz', 'eflatun', 'altın',
    'gümüş', 'bronz', 'bej', 'krem', 'sayı',
    'bir', 'iki', 'üç', 'dört', 'beş',
    'altı', 'yedi', 'sekiz', 'dokuz', 'on',
    'yirmi', 'otuz', 'kırk', 'elli', 'altmış',
    'yetmiş', 'seksen', 'doksan', 'yüz', 'bin',
    'gün', 'pazartesi', 'salı', 'çarşamba', 'perşembe',
    'cuma', 'cumartesi', 'pazar', 'ay', 'ocak',
    'şubat', 'mart', 'nisan', 'mayıs', 'haziran',
    'temmuz', 'ağustos', 'eylül', 'ekim', 'kasım',
    'aralık', 'yıl', 'hafta', 'saat', 'dakika',
    'saniye', 'sabah', 'öğle', 'akşam', 'gece',
    'gündüz', 'mevsim', 'ilkbahar', 'yaz', 'sonbahar',
    'kış', 'ülke', 'Türkiye', 'Almanya', 'Fransa',
    'İngiltere', 'İtalya', 'İspanya', 'Rusya', 'Çin',
    'Japonya', 'Amerika', 'Kanada', 'Brezilya', 'Arjantin',
    'Mısır', 'Güney Afrika', 'Avustralya', 'Yeni Zelanda', 'Hindistan',
    'Pakistan', 'şehir', 'İstanbul', 'Ankara', 'İzmir',
    'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep',
    'Kayseri', 'Mersin', 'Diyarbakır', 'Samsun', 'Denizli',
    'Eskişehir', 'Urfa', 'Malatya', 'Erzurum', 'Van',
    'Batman', 'meslek', 'doktor', 'mühendis', 'avukat',
    'öğretmen', 'hemşire', 'pilot', 'gazeteci', 'ressam',
    'müzisyen', 'şarkıcı', 'oyuncu', 'yazar', 'şair',
    'mimar', 'diş hekimi', 'veteriner', 'eczacı', 'teknisyen',
    'aile', 'anne', 'baba', 'kardeş', 'dede',
    'nene', 'amca', 'dayı', 'teyze', 'hala',
    'kuzen', 'ev', 'oda', 'mutfak', 'banyo',
    'salon', 'yatak', 'dolap', 'halı', 'perde',
    'lamba', 'giysi', 'elbise', 'gömlek', 'pantolon',
    'etek', 'ceket', 'kazak', 'tişört', 'şort',
    'ayakkabı', 'çorap', 'şapka', 'eldiven', 'atkı',
    'kemer', 'çanta', 'cüzdan', 'saat', 'gözlük',
    'takı', 'ulaşım', 'araba', 'otobüs', 'tren',
    'uçak', 'gemi', 'feribot', 'metro', 'tramvay',
    'taksi', 'dolmuş', 'bisiklet', 'motosiklet', 'kamyon',
    'kamyonet', 'tır', 'tank', 'helikopter', 'yat',
    'jet', 'sağlık', 'hastane', 'doktor', 'hemşire',
    'eczane', 'ilaç', 'tedavi', 'ameliyat', 'muayene',
    'kontrol', 'test', 'röntgen', 'ultrason', 'kan',
    'idrar', 'tansiyon', 'ateş', 'öksürük', 'baş ağrısı',
    'grip', 'duygu', 'mutlu', 'üzgün', 'kızgın',
    'korkmuş', 'şaşkın', 'heyecanlı', 'sakin', 'gergin',
    'rahat', 'huzurlu', 'endişeli', 'gururlu', 'utangaç',
    'cesur', 'korkak', 'kararlı', 'kararsız', 'sabırlı',
    'şekil', 'daire', 'kare', 'üçgen', 'dikdörtgen',
    'oval', 'yıldız', 'kalp', 'ok', 'çizgi',
    'nokta', 'küp', 'küre', 'silindir', 'koni',
    'piramit', 'prizma', 'elips', 'paralelkenar', 'eşkenar',
    'yamuk'
];

// Test fonksiyonu
async function testAPIs() {
    console.log('🚀 Kelime API\'leri test ediliyor...\n');
    
    let tdkBasarili = 0;
    let wiktionaryBasarili = 0;
    let toplamTest = 0;
    
    for (const kelime of testKelimeler) {
        toplamTest++;
        console.log(`\n📝 Test ${toplamTest}: "${kelime}"`);
        
        const tdkSonuc = await testTDKAPI(kelime);
        const wiktionarySonuc = await testWiktionaryAPI(kelime);
        
        if (tdkSonuc) tdkBasarili++;
        if (wiktionarySonuc) wiktionaryBasarili++;
        
        // API'ler arasında kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
               console.log('\n📊 TEST SONUÇLARI:');
           console.log(`📈 Toplam test edilen kelime: ${toplamTest}`);
           console.log(`✅ TDK API başarılı: ${tdkBasarili}/${toplamTest} (${Math.round(tdkBasarili/toplamTest*100)}%)`);
           console.log(`✅ Wiktionary API başarılı: ${wiktionaryBasarili}/${toplamTest} (${Math.round(wiktionaryBasarili/toplamTest*100)}%)`);
           console.log(`🎯 En az bir API'de bulunan: ${Math.max(tdkBasarili, wiktionaryBasarili)}/${toplamTest} (${Math.round(Math.max(tdkBasarili, wiktionaryBasarili)/toplamTest*100)}%)`);
           
           // TDK API'nin daha iyi çalıştığını vurgula
           if (tdkBasarili > wiktionaryBasarili) {
               console.log(`\n🏆 TDK API daha iyi performans gösteriyor! (${tdkBasarili - wiktionaryBasarili} kelime daha fazla buldu)`);
           } else if (wiktionaryBasarili > tdkBasarili) {
               console.log(`\n🏆 Wiktionary API daha iyi performans gösteriyor! (${wiktionaryBasarili - tdkBasarili} kelime daha fazla buldu)`);
           } else {
               console.log(`\n🤝 Her iki API de aynı performansı gösteriyor!`);
           }
}

// Testi başlat
testAPIs().catch(console.error); 