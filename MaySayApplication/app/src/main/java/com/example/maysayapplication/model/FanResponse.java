package com.example.maysayapplication.model;

public class FanResponse {
    private String message;  // nếu thành công
    private Boolean fanStatus;  // nếu thành công
    private String error;    // nếu lỗi

    // Getter và Setter
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Boolean getFanStatus() {
        return fanStatus;
    }

    public void setFanStatus(Boolean fanStatus) {
        this.fanStatus = fanStatus;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
