# Wee Woo 🚑

[![Actions Status](https://github.com/thomastoye/weewoo/workflows/node/badge.svg)](https://github.com/thomastoye/weewoo/actions)

An experiment in Event Sourcing with JavaScript/TypeScript.

## The domain

### Events

* Ambulance moved (position updated)
* Key box opened
* Non urgent patient transport assignment started
* Arrived at patient pick-up location (home, hospital, care centre, ...)
* Arrived at patient drop-off location (home, hospital, care centre, ...)
* Patient transport finished, available for new assignment
* Arrived at posting
* Logistics assignment started
* Left posting for logistics assignment
* Left posting for non urgent patient transport
* Logistics assignment finished, available for new assignment
* (Unrefined events concerning disaster relief assignments and preventive relief actions)

### Commands

* Register current position
* Unlock key box
* ...

### Aggregates

Currently, the main aggregate is `Ambulance`. But I feel like further modelling will reveal `Assignment` as an important aggregate.
