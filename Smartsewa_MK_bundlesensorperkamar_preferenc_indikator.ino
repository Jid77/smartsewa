#include <WiFi.h>
#include <DHT.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>
#include <Preferences.h>

#define DHTTYPE DHT22

// Konfigurasi WiFi & API
const char* ssid = "Pixel_3510";
const char* password = "123qee000";
const char* apiSensorpost = "https://smartsewa-be-production.up.railway.app/api/sensor";
String apiRelayget = "https://smartsewa-be-production.up.railway.app/api/relay-status?kamars=1,2,3,4,5,6";
const char* deviceId = "smartsewa_dev01";

// Pin indikator
const uint8_t LED_PIN = 2;
const uint8_t BUZZER_PIN = 27;

// Timing
const unsigned long sendInterval = 600000UL;  // 10 menit
unsigned long lastSendTime = 0;
unsigned long prevMillis = 0;
bool firstRun = true;

Preferences preferences;

// Struktur sensor per kamar
struct KamarSensor {
  int kamar;
  uint8_t dhtPin;
  uint8_t soundPin;
  uint8_t relayPin;
  bool dhtAktif;
  bool soundAktif;
};

const int TOTAL_KAMAR = 6;
KamarSensor kamarList[TOTAL_KAMAR] = {
  {1, 4,  32, 16, false, false},
  {2, 5,  33, 17, false, false},
  {3, 13, 34, 18, false, false},
  {4, 14, 35, 19, false, false},
  {5, 25, 36, 21, false, false},
  {6, 26, 39, 22, false, false}
};

// Sampling suara
const int sampleCount = 100;
const int avgWindow = 10;

// Buzzer Logic
bool needBuzzer = false;
bool buzzerActive = false;
unsigned long buzzerStartTime = 0;
unsigned long lastBuzzerToggle = 0;
bool buzzerState = false;

const unsigned long buzzerFlipFlopDuration = 5000; // flip-flop maksimal 5 detik
const unsigned long buzzerInterval = 300; // interval flip-flop per 300ms

void setup() {
  Serial.begin(115200);
  delay(1000);

  setupIndicators();
  connectToWiFi();
  setupSensors();
  setupRelayPins();
  loadRelayFromPreferences();

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  Serial.println("Setup selesai.");
}

void loop() {
  checkWiFiReconnect();
  updateWiFiLED();

  if (firstRun) {
    Serial.println("Pengiriman pertama kali setelah boot...");
    processDataCycle();
    lastSendTime = millis();
    firstRun = false;
  }

  if (millis() - lastSendTime >= sendInterval) {
    processDataCycle();
    lastSendTime = millis();
  }

  updateBuzzer();
  delay(100);
}

// ========== FUNGSI-FUNGSI UTAMA ==========

void processDataCycle() {
  needBuzzer = false;
  sendSensorDataToBackend();
  checkRelayStatus();

  if (needBuzzer) {
    buzzerActive = true;
    buzzerStartTime = millis();
    lastBuzzerToggle = 0;
    Serial.println("=== Buzzer aktif karena deteksi abnormal ===");
  }
}

void sendSensorDataToBackend() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi tidak terhubung, skip pengiriman");
    return;
  }

  time_t now;
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Gagal mendapatkan waktu");
    return;
  }

  char timestamp[30];
  strftime(timestamp, sizeof(timestamp), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);

  DynamicJsonDocument doc(2048);
  doc["deviceId"] = deviceId;
  doc["timestamp"] = timestamp;
  JsonArray data = doc.createNestedArray("sensorData");

  bool adaDataValid = false;

  for (int i = 0; i < TOTAL_KAMAR; i++) {
    if (kamarList[i].dhtAktif && kamarList[i].soundAktif) {
      DHT dht(kamarList[i].dhtPin, DHTTYPE);
      float suhu = dht.readTemperature();
      float hum = dht.readHumidity();
      float suaraDb = readSoundLevel(kamarList[i].soundPin);

      bool validData = (!isnan(suhu) && !isnan(hum) && suaraDb > 0);
      if (validData) {
        JsonObject kamarObj = data.createNestedObject();
        kamarObj["kamar"] = kamarList[i].kamar;
        kamarObj["suhu"] = suhu;
        kamarObj["kelembapan"] = hum;
        kamarObj["suara"] = suaraDb;
        adaDataValid = true;
        Serial.printf("Kamar %d: Semua sensor valid, data dikirim\n", kamarList[i].kamar);

        if (suhu < 15 || suhu > 35 || hum < 20 || hum > 80 || suaraDb > 85) {
          needBuzzer = true;
          Serial.printf("Kamar %d: Sensor abnormal!\n", kamarList[i].kamar);
        }
      } else {
        Serial.printf("Kamar %d: Data tidak valid\n", kamarList[i].kamar);
        // needBuzzer = true;
      }
    } else {
      Serial.printf("Kamar %d: Sensor tidak lengkap, skip\n", kamarList[i].kamar);
    }
  }

  if (adaDataValid) {
    String jsonData;
    serializeJson(doc, jsonData);

    HTTPClient http;
    http.begin(apiSensorpost);
    http.addHeader("Content-Type", "application/json");

    Serial.println("Mengirim data sensor:");
    Serial.println(jsonData);

    int httpCode = http.POST(jsonData);
    if (httpCode > 0) {
      Serial.printf("[HTTP] Respon: %d\n", httpCode);
    } else {
      Serial.printf("[HTTP] Gagal: %s\n", http.errorToString(httpCode).c_str());
    }
    http.end();
  } else {
    Serial.println("Tidak ada data lengkap untuk dikirim.");
  }
}

void checkRelayStatus() {
  static unsigned long lastUpdate = 0;

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi terputus, menggunakan status terakhir");
    return;
  }

  HTTPClient http;
  http.begin(apiRelayget);
  int httpCode = http.GET();

  if (httpCode == 200) {
    String payload = http.getString();
    DynamicJsonDocument doc(1024);
    if (deserializeJson(doc, payload) == DeserializationError::Ok) {
      bool updated = false;

      for (JsonObject obj : doc.as<JsonArray>()) {
        int kamar = obj["kamar"];
        bool newStatus = obj["is_active"];

        for (int i = 0; i < TOTAL_KAMAR; i++) {
          if (kamarList[i].kamar == kamar) {
            bool current = digitalRead(kamarList[i].relayPin);
            if (current != newStatus) {
              digitalWrite(kamarList[i].relayPin, newStatus);
              updated = true;
            }
          }
        }
      }

      if (updated && millis() - lastUpdate > 300000) {
        preferences.begin("relay", false);
        for (int i = 0; i < TOTAL_KAMAR; i++) {
          preferences.putBool(("kamar" + String(i)).c_str(), digitalRead(kamarList[i].relayPin));
        }
        preferences.end();
        lastUpdate = millis();
        Serial.println("Relay status disimpan");
      }
    }
  } else {
    Serial.printf("Gagal cek relay: %d\n", httpCode);
  }
  http.end();
}

// ========== BACAAN SENSOR SUARA ==========

int getPeakToPeak(int pin, int samples = 100) {
  int maxVal = 0;
  int minVal = 4095;
  for (int i = 0; i < samples; i++) {
    int val = analogRead(pin);
    if (val > maxVal) maxVal = val;
    if (val < minVal) minVal = val;
    delay(1);
  }
  return maxVal - minVal;
}

float mapToDb(int peakToPeak) {
  return map(peakToPeak, 0, 1024, 30, 90);
}

float readSoundLevel(int pin) {
  float totalDb = 0;
  for (int i = 0; i < avgWindow; i++) {
    int peakToPeak = getPeakToPeak(pin, sampleCount);
    float estimatedDb = mapToDb(peakToPeak);
    totalDb += estimatedDb;
    delay(20);
  }
  return totalDb / avgWindow;
}

// ========== SETUP FUNGSI ==========

void setupSensors() {
  for (int i = 0; i < TOTAL_KAMAR; i++) {
    DHT dht(kamarList[i].dhtPin, DHTTYPE);
    dht.begin();
    delay(1000);
    float suhu = dht.readTemperature();
    float hum = dht.readHumidity();

    if (!isnan(suhu) && !isnan(hum)) {
      kamarList[i].dhtAktif = true;
      Serial.printf("Kamar %d: DHT aktif di pin %d\n", kamarList[i].kamar, kamarList[i].dhtPin);
    }

    pinMode(kamarList[i].soundPin, INPUT);
    int suara = analogRead(kamarList[i].soundPin);
    if (suara > 0 && suara < 4095) {
      kamarList[i].soundAktif = true;
      Serial.printf("Kamar %d: Sound aktif di pin %d\n", kamarList[i].kamar, kamarList[i].soundPin);
    }
  }
}

void setupRelayPins() {
  for (int i = 0; i < TOTAL_KAMAR; i++) {
    pinMode(kamarList[i].relayPin, OUTPUT);
    digitalWrite(kamarList[i].relayPin, LOW);
  }
}

void loadRelayFromPreferences() {
  preferences.begin("relay", true);
  for (int i = 0; i < TOTAL_KAMAR; i++) {
    bool state = preferences.getBool(("kamar" + String(i)).c_str(), false);
    digitalWrite(kamarList[i].relayPin, state);
    Serial.printf("Kamar %d: Relay di-set ke %s\n", kamarList[i].kamar, state ? "ON" : "OFF");
  }
  preferences.end();
}

// ========== BUZZER HANDLING ==========

void updateBuzzer() {
  if (buzzerActive) {
    if (millis() - buzzerStartTime < buzzerFlipFlopDuration) {
      if (millis() - lastBuzzerToggle >= buzzerInterval) {
        buzzerState = !buzzerState;
        digitalWrite(BUZZER_PIN, buzzerState);
        lastBuzzerToggle = millis();
      }
    } else {
      digitalWrite(BUZZER_PIN, LOW);
      buzzerActive = false;
      buzzerState = false;
    }
  } else {
    digitalWrite(BUZZER_PIN, LOW);
  }
}

// ========== WIFI HANDLING ==========

void connectToWiFi() {
  Serial.printf("Menyambungkan ke WiFi: %s\n", ssid);
  WiFi.begin(ssid, password);
  uint8_t retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    Serial.print(".");
    retry++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi terhubung");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nGagal konek WiFi");
  }
}

void checkWiFiReconnect() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi terputus, reconnect...");
    connectToWiFi();
  }
}

void setupIndicators() {
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
}

void updateWiFiLED() {
  if (WiFi.status() == WL_CONNECTED) {
    if (millis() - prevMillis > 500) {
      prevMillis = millis();
      digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    }
  } else {
    digitalWrite(LED_PIN, HIGH);
  }
}
