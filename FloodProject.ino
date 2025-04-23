#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <HTTPClient.h>

// Pin Definitions
const int TRIG_PIN = 5;      // Ultrasonic sensor trigger
const int ECHO_PIN = 18;     // Ultrasonic sensor echo
const int BUZZER_PIN = 19;   // Buzzer
const int FLOW_PIN = 27;     // Flow sensor
const int SDA_PIN = 21;      // LCD SDA
const int SCL_PIN = 22;      // LCD SCL

// Constants
const float DANGER_LEVEL = 10.0;  // Distance in cm that triggers alarm
const float SPEED_OF_SOUND = 0.034;  // Speed of sound in cm/microsecond

// Flow sensor variables
volatile int flowFrequency = 0;  // Measures flow sensor pulses
float flowRate = 0.0;            // Calculated flow rate
unsigned int flowMilliLitres = 0;
unsigned long totalMilliLitres = 0;
unsigned long oldTime = 0;

// LCD setup (0x27 is the typical I2C address, adjust if needed)
LiquidCrystal_I2C lcd(0x27, 16, 2);

// WiFi credentials
const char* ssid1 = "6763";
const char* password1 = "0000002";
const char* ssid2 = "NTALE 1";
const char* password2 = "100100100";

// Google Script ID and URL
const char* scriptURL = "https://script.google.com/macros/s/AKfycbz0aCrDzH6-sqMpsxGcR-I4rXIVDzPDNJL_cnpW7p_qT8jkT0OfpKqmi8bpRJE2CEVhuQ/exec";

// Global variables for WiFi status
String currentSSID;      // Store which SSID we're connected to
bool wifiConnected = false;  // Track connection status

// Flow sensor interrupt service routine
void IRAM_ATTR flowPulseCounter() {
    flowFrequency++;
}

void setup() {
    Serial.begin(115200);
    
    // Initialize pins
    pinMode(TRIG_PIN, OUTPUT);
    pinMode(ECHO_PIN, INPUT);
    pinMode(BUZZER_PIN, OUTPUT);
    pinMode(FLOW_PIN, INPUT_PULLUP);
    
    // Initialize LCD
    Wire.begin(SDA_PIN, SCL_PIN);
    lcd.init();
    lcd.backlight();
    lcd.clear();
    lcd.print("Flood Monitor");
    lcd.setCursor(0, 1);
    lcd.print("Initializing...");
    
    // Setup flow sensor interrupt
    attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, RISING);
    
    // Try to connect to first WiFi network
    Serial.println("Connecting to WiFi...");
    WiFi.begin(ssid1, password1);
    
    // Wait for 10 seconds to connect to first network
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    // If first network fails, try second network
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("\nFailed to connect to first network. Trying second network...");
        WiFi.disconnect();
        delay(1000);
        WiFi.begin(ssid2, password2);
        
        attempts = 0;
        while (WiFi.status() != WL_CONNECTED && attempts < 20) {
            delay(500);
            Serial.print(".");
            attempts++;
        }
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        wifiConnected = true;
        currentSSID = WiFi.SSID();
        Serial.println("\nWiFi connected");
        Serial.print("Connected to: ");
        Serial.println(currentSSID);
        Serial.print("IP address: ");
        Serial.println(WiFi.localIP());
    } else {
        Serial.println("\nFailed to connect to any network");
        wifiConnected = false;
    }
}

float measureDistance() {
    // Trigger ultrasonic measurement
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);
    
    // Read echo
    long duration = pulseIn(ECHO_PIN, HIGH);
    float distance = duration * SPEED_OF_SOUND / 2;
    
    return distance;
}

void calculateFlow() {
    if ((millis() - oldTime) > 1000) {   // Update every second
        // Disable interrupt while calculating
        detachInterrupt(digitalPinToInterrupt(FLOW_PIN));
        
        // Calculate flow rate (pulses to L/min)
        // Sensor factor: 7.5 gives flow rate in L/min
        flowRate = ((1000.0 / (millis() - oldTime)) * flowFrequency) / 7.5;
        
        // Calculate flow in milliliters over the last second
        flowMilliLitres = (flowRate / 60) * 1000;
        
        // Add milliliters to total
        totalMilliLitres += flowMilliLitres;
        
        // Reset counter and timer
        oldTime = millis();
        flowFrequency = 0;
        
        // Re-enable interrupt
        attachInterrupt(digitalPinToInterrupt(FLOW_PIN), flowPulseCounter, RISING);
    }
}

void updateLCD(float distance, float flowRate) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Dist: ");
    lcd.print(distance);
    lcd.print("cm");
    
    lcd.setCursor(0, 1);
    lcd.print("Flow: ");
    lcd.print(flowRate);
    lcd.print("L/m");
}

void checkFloodCondition(float distance) {
    if (distance < DANGER_LEVEL) {
        // Activate buzzer alarm
        digitalWrite(BUZZER_PIN, HIGH);
    } else {
        digitalWrite(BUZZER_PIN, LOW);
    }
}

void sendToGoogleSheets(float distance, float flowRate) {
    if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        String url = String(scriptURL) + "?distance=" + String(distance, 2) + 
                    "&flowrate=" + String(flowRate, 2);
        
        http.begin(url);
        int httpCode = http.GET();
        
        if (httpCode > 0) {
            String response = http.getString();
            Serial.println("Data sent to Google Sheets: " + response);
        } else {
            Serial.println("Error sending data to Google Sheets");
        }
        
        http.end();
    }
}

void loop() {
    // Measure water level
    float distance = measureDistance();
    
    // Calculate flow rate
    calculateFlow();
    
    // Update LCD display
    updateLCD(distance, flowRate);
    
    // Print readings to Serial Monitor
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.print(" cm\t");
    Serial.print("Flow rate: ");
    Serial.print(flowRate);
    Serial.println(" L/min");
    
    // Check for flood conditions
    checkFloodCondition(distance);
    
    // Send data to Google Sheets every 5 seconds
    static unsigned long lastUpload = 0;
    if (millis() - lastUpload > 5000) {
        sendToGoogleSheets(distance, flowRate);
        lastUpload = millis();
    }
    
    delay(600);  // Small delay to prevent overwhelming the system
}