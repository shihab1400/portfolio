---
title: Smart Multi-Plug
description: An ESP32 smart plug with four relay-controlled outlets, countdown timers and a temperature alarm, controlled from a web dashboard over MQTT.
thumbnail: ./smart-multi-plug.png
thumbnailAlt: Smart Home dashboard with a status bar, temperature and humidity cards, and four relay cards with on/off toggles and timer inputs
technologies: [ESP32, Arduino, C++, MQTT, HiveMQ Cloud, MQTT.js, JavaScript, HTML, CSS, DHT22]
category: IoT
featured: true
repositoryUrl: https://github.com/shihab1400/Microprocessor_SmartMultiplug
publishDate: 2026-10-28
purpose: Let four ordinary appliances be switched on, off or on a timer from any browser, and warn when the room gets too hot, using only an ESP32, a relay module and a cloud MQTT broker.
features:
    - Four relay-controlled outlets with individual toggles and "all on" / "all off" controls
    - Per-outlet countdown timers of up to 24 hours that turn the outlet off when they reach zero
    - Live temperature and humidity from a DHT22 sensor, refreshed every second
    - A buzzer and on-screen alert banner when the temperature passes 35 °C
    - Login checked by the ESP32 itself, with credentials you can change from the dashboard and that survive a reboot
challenge: The browser and the ESP32 never talk directly, only through a cloud broker. So the dashboard has to stay in sync with the real relay states, timers and sensor readings, even when commands come from another tab or the device restarts.
solution: The ESP32 is the single source of truth. It runs the timers, reports every relay change and timer tick back over MQTT, and the dashboard updates its UI from those messages. Login works as a request and response over pub/sub, matched by a session ID and given up after 10 seconds.
---

Smart Multi-Plug is a university microprocessor course project. It has two parts: Arduino firmware for an ESP32 that drives a 4-channel relay module, a DHT22 sensor and a buzzer, and a static web dashboard. The two parts communicate only through a HiveMQ Cloud MQTT broker. The firmware connects over TLS and the browser over secure WebSockets, so the plug can be controlled from anywhere with an internet connection.

## Implementation

**Relay control**

Each outlet has its own MQTT topic, and the dashboard sends a plain `ON` or `OFF` to it. The ESP32 switches the relay pin and publishes a status message back, which every open dashboard uses to update its toggles. "Turn all on" and "turn all off" send the four commands 300 ms apart, so the relays don't all switch at once.

**Timers**

- **Setting:** the user enters hours, minutes and seconds on an outlet card. The ESP32 turns that outlet on and starts a countdown based on `millis()`.
- **Progress:** while a timer runs, the ESP32 publishes the remaining time every second. The card shows it as `HH:MM:SS` and highlights the last minute.
- **Finishing:** when the countdown reaches zero, the ESP32 turns the outlet off and reports that the timer has finished.
- **Overriding:** toggling an outlet by hand asks for confirmation and then cancels its timer. The firmware cancels it too if the command arrives from elsewhere.

**Sensor and alarm**

The ESP32 reads the DHT22 every second and publishes temperature and humidity as JSON. Above 35 °C it turns the buzzer on and publishes an alert, which shows a red banner on the dashboard. When the temperature drops back, both the buzzer and the banner turn off. Failed readings are skipped instead of being sent.

**Authentication**

The dashboard sends the username, password and a session ID to the ESP32, which checks them against credentials saved in its flash memory using `Preferences`. Only a successful reply with the matching session ID unlocks the controls. The same flow lets a signed-in user change the username and password, which is allowed only after the current password is confirmed.

## Design

The dashboard is a single page with a login screen, the main control panel and a change-credentials screen, built with plain HTML, CSS and JavaScript and no framework. A status bar shows the broker connection, the number of active relays and timers, the sensor state and the last update time. Below it are the temperature and humidity cards and one card per outlet, with a toggle, a status dot and the timer controls. There are light and dark themes, and the chosen theme is remembered in a cookie.

## Hardware

- **Controller:** ESP32 dev board
- **Outlets:** 4-channel relay module on GPIO 4, 19, 21 and 22, labeled Living Room Lights, Bedroom Fan, Kitchen Appliances and Garden Lights
- **Sensor:** DHT22 temperature and humidity sensor on GPIO 2
- **Alarm:** active buzzer on GPIO 5
