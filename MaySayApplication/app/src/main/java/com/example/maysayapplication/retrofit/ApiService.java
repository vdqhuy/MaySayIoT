package com.example.maysayapplication.retrofit;

import com.example.maysayapplication.model.FanResponse;
import com.example.maysayapplication.model.Status;
import com.example.maysayapplication.model.ThresholdResponse;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.Query;

public interface ApiService {
    @GET("api/fanStatus")
    Call<Status> getStatus();

    @GET("api/setThreshold")
    Call<ThresholdResponse> setThreshold(@Query("threshold") float threshold);

    @GET("api/set-fan")
    Call<FanResponse> setFan(@Query("status") String status);
}
