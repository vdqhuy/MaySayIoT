package com.example.maysayapplication;

import android.os.Bundle;
import android.os.Handler;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.SwitchCompat;

import com.example.maysayapplication.model.FanResponse;
import com.example.maysayapplication.model.Status;
import com.example.maysayapplication.retrofit.RetrofitClient;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private EditText edtThreshold;
    private TextView txtTemperature, txtFanStatus;
    private SwitchCompat swFan;
    private Handler handler;
    private Runnable statusRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        Button btnSetThreshold = findViewById(R.id.btnSetThreshold);
        edtThreshold = findViewById(R.id.edtThreshold);
        txtTemperature = findViewById(R.id.txtTemperature);
        txtFanStatus = findViewById(R.id.txtFanStatus);
        swFan = findViewById(R.id.switchFan);

        // Tạo một Handler và Runnable để lấy trạng thái định kỳ
        handler = new Handler();
        statusRunnable = new Runnable() {
            @Override
            public void run() {
                getStatus();  // Gọi API lấy trạng thái
                handler.postDelayed(this, 5000);  // Chạy lại sau 5 giây (5000ms)
            }
        };
        // Bắt đầu lấy trạng thái định kỳ
        handler.post(statusRunnable);

        // Cập nhật ngưỡng nhiệt độ khi bấm nút
        btnSetThreshold.setOnClickListener(v -> setThreshold());

        swFan.setOnClickListener(v -> setFan());
    }

    // Lấy trạng thái của quạt và nhiệt độ từ ESP32
    private void getStatus() {
        RetrofitClient.getInstance().getStatus().enqueue(new Callback<Status>() {
            @Override
            public void onResponse(Call<Status> call, Response<Status> response) {
                if (response.isSuccessful()) {
                    Status status = response.body();
                    if (status != null) {
                        // Cập nhật nhiệt độ và trạng thái quạt lên màn hình
                        String temperature = "Nhiệt độ: " + status.getTemperature() + " °C";
                        String fanStatus = "Quạt: " + (status.isFanStatus() ? "Bật" : "Tắt");

                        txtTemperature.setText(temperature);
                        txtFanStatus.setText(fanStatus);

                        edtThreshold.setText(String.valueOf(status.getThreshold()));  // Cập nhật ngưỡng
                    }
                }
            }

            @Override
            public void onFailure(Call<Status> call, Throwable t) {
                txtTemperature.setText("Lỗi: " + t.getMessage());
                txtFanStatus.setText("Lỗi kết nối");
            }
        });
    }

    // Cập nhật ngưỡng nhiệt độ lên ESP32
    private void setThreshold() {
        String thresholdStr = edtThreshold.getText().toString();
        if (!thresholdStr.isEmpty()) {
            float threshold = Float.parseFloat(thresholdStr);
            RetrofitClient.getInstance().setThreshold(threshold).enqueue(new Callback<String>() {
                @Override
                public void onResponse(Call<String> call, Response<String> response) {
                    if (response.isSuccessful()) {
                        String msg = "Đã đặt ngưỡng: " + response.body();
                        txtFanStatus.setText(msg);  // Hiển thị kết quả lệnh vào TextView
                    }
                }

                @Override
                public void onFailure(Call<String> call, Throwable t) {
                    txtFanStatus.setText("Lỗi: " + t.getMessage());
                }
            });
        } else {
            txtFanStatus.setText("Nhập ngưỡng hợp lệ!");
        }
    }

    // Điều chỉnh trạng thái quạt
    private void setFan() {
        String status = swFan.isChecked() ? "on" : "off";

        RetrofitClient.getInstance().setFan(status).enqueue(new Callback<FanResponse>() {
            @Override
            public void onResponse(Call<FanResponse> call, Response<FanResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    String msg = response.body().getMessage();  // Lấy message từ FanResponse
                    txtFanStatus.setText(msg);
                } else {
                    txtFanStatus.setText("Không thể cập nhật trạng thái quạt");
                }
            }

            @Override
            public void onFailure(Call<FanResponse> call, Throwable t) {
                txtFanStatus.setText("Lỗi: " + t.getMessage());
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        // Dừng Runnable khi Activity bị hủy
        if (handler != null) {
            handler.removeCallbacks(statusRunnable);
        }
    }
}
