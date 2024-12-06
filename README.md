# crybot

Crybot is a robot-artwork made with a raspberry pi, a soil sensor, a screen, a keyboard, a selonoid and a relay. Crybot asks people to make it sad so that it can cry, thus watering a fern in the galery space.
Crybot works as a node.js app. Frontend uses p5.js to display the interface on localhost:3000, backend takes care of serving the project and handeling the robotics (watering and soil sensing). The sentiment analysis works with a modified version of AFINN, that is more sensitive to ecological keywords.
