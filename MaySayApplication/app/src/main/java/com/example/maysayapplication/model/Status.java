package com.example.maysayapplication.model;

public class Status {
    private float temperature;
    private boolean fanStatus;
    private float threshold;

    public float getTemperature() {
        return temperature;
    }

    public void setTemperature(float temperature) {
        this.temperature = temperature;
    }

    public boolean isFanStatus() {
        return fanStatus;
    }

    public void setFanStatus(boolean fanStatus) {
        this.fanStatus = fanStatus;
    }

    public float getThreshold() {
        return threshold;
    }

    public void setThreshold(float threshold) {
        this.threshold = threshold;
    }
}