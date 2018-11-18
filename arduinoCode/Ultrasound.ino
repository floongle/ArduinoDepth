#include <Arduino.h>

#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>

#include <ESP8266HTTPClient.h>

#define USE_SERIAL Serial
ESP8266WiFiMulti WiFiMulti;

/*
HC-SR04 Ping distance sensor]
VCC to arduino 5v GND to arduino GND
Echo to Arduino pin 13 Trig to Arduino pin 12
Red POS to Arduino pin 11
Green POS to Arduino pin 10
560 ohm resistor to both LED NEG and GRD power rail
More info at: http://goo.gl/kJ8Gl
Original code improvements to the Ping sketch sourced from Trollmaker.com
Some code and wiring inspired by http://en.wikiversity.org/wiki/User:Dstaub/robotcar
*/

#define trigPin 2
#define echoPin 0
#define resetPin 5


void setup() {
  digitalWrite(resetPin, HIGH);
  
  USE_SERIAL.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(resetPin, OUTPUT); 
  pinMode(echoPin, INPUT);

  for (uint8_t t = 4; t > 0; t--) {
    USE_SERIAL.printf("[SETUP] WAIT %d...\n", t);
    USE_SERIAL.flush();
    delay(1000);
  }

  WiFi.mode(WIFI_STA);
  WiFiMulti.addAP("automagical", "like it was meant to be");

}

void(* resetFunc) (void) = 0; //declare reset function @ address 0


void loop() {

 // wait for WiFi connection
  USE_SERIAL.print("Trying to connect to wifi\n");
  if ((WiFiMulti.run() == WL_CONNECTED)) {

    HTTPClient http;

    USE_SERIAL.print("[HTTP] begin...\n");
    // configure traged server and url
  
    int depth = getDepth();

  String webURL = "http://192.168.0.32:8125/depth?depth=";

  webURL.concat(depth);
  USE_SERIAL.println("Submitting result: [" + webURL + "].\n");
    
    http.begin(webURL); //HTTP
  
    USE_SERIAL.print("[HTTP] GET...\n");
    // start connection and send HTTP header
    int httpCode = http.GET();

    // httpCode will be negative on error
    if (httpCode > 0) {
      // HTTP header has been send and Server response header has been handled
      USE_SERIAL.printf("[HTTP] GET DEPTH code: %d\n", httpCode);

      // file found at server
      if (httpCode == HTTP_CODE_OK) {
        String payload = http.getString();
        USE_SERIAL.println(payload);
      }
    } else {
      USE_SERIAL.printf("[HTTP] GET... failed, error: %s\n", http.errorToString(httpCode).c_str());
    }

    http.end();
  }

  delay(10000);

  Serial.println("resetting");
  delay(10);
  digitalWrite(resetPin, LOW);
  Serial.println("this never happens");



////



}

int getDepth()
  {
  long duration, distance;
  digitalWrite(trigPin, LOW);  // Added this line
  delayMicroseconds(2); // Added this line
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10); // Added this line
  digitalWrite(trigPin, LOW);
  duration = pulseIn(echoPin, HIGH);
  distance = (duration/2) / 29.1;

  if (distance >= 200 || distance <= 0){
    USE_SERIAL.println("Out of range");
  }
  else {
    USE_SERIAL.print(distance);
    USE_SERIAL.println(" cm");
  }
  return distance;
}
