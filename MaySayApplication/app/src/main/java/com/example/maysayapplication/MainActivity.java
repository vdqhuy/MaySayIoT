package com.example.maysayapplication;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class MainActivity extends AppCompatActivity {

    private TextView txtTemperature, txtFanStatus;
    private EditText edtThreshold;
    private Button btnSetThreshold;

    private DatabaseReference tempRef, fanRef, thresholdRef;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        txtTemperature = findViewById(R.id.txtTemperature);
        txtFanStatus = findViewById(R.id.txtFanStatus);
        edtThreshold = findViewById(R.id.edtThreshold);
        btnSetThreshold = findViewById(R.id.btnSetThreshold);

        // Firebase setup
        FirebaseDatabase database = FirebaseDatabase.getInstance();
        tempRef = database.getReference("temperature");
        fanRef = database.getReference("fan");
        thresholdRef = database.getReference("threshold"); // Tham chiếu tới threshold

        // Theo dõi nhiệt độ
        tempRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                Double temp = snapshot.getValue(Double.class);
                if (temp != null) {
                    txtTemperature.setText("Nhiệt độ: " + temp + " °C");
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) {
                txtTemperature.setText("Lỗi đọc nhiệt độ!");
            }
        });

        // Theo dõi trạng thái quạt
        fanRef.addValueEventListener(new ValueEventListener() {
            @Override
            public void onDataChange(@NonNull DataSnapshot snapshot) {
                Boolean fanOn = snapshot.getValue(Boolean.class);
                if (fanOn != null) {
                    txtFanStatus.setText(fanOn ? "Quạt: Đang bật" : "Quạt: Đang tắt");
                }
            }

            @Override
            public void onCancelled(@NonNull DatabaseError error) { }
        });

        // Xử lý sự kiện khi nhấn nút "Đặt ngưỡng"
        btnSetThreshold.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                String thresholdStr = edtThreshold.getText().toString().trim();
                if (!thresholdStr.isEmpty()) {
                    try {
                        double threshold = Double.parseDouble(thresholdStr);
                        thresholdRef.setValue(threshold);
                        Toast.makeText(MainActivity.this, "Đã cập nhật ngưỡng: " + threshold + " °C", Toast.LENGTH_SHORT).show();
                        edtThreshold.setText("");
                    } catch (NumberFormatException e) {
                        Toast.makeText(MainActivity.this, "Vui lòng nhập đúng số!", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(MainActivity.this, "Vui lòng nhập ngưỡng!", Toast.LENGTH_SHORT).show();
                }
            }
        });
    }
}
