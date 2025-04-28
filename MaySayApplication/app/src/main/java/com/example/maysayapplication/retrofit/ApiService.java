package com.example.maysayapplication.retrofit;

import com.example.maysayapplication.model.Status;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface ApiService {
    @GET("/status")
    Call<Status> getStatus();

    @GET("set-threshold")
    Call<String> setThreshold(@Query("threshold") float threshold);

    @GET("set-fan")
    Call<String> setFan(@Query("status") String status);
}
