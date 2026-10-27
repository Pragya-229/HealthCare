from rest_framework import serializers

from .models import Doctor, Patient, PatientDoctorMapping


class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            "id", "name", "age", "gender", "phone", "address",
            "medical_history", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_age(self, value):
        if value > 120:
            raise serializers.ValidationError("Age doesn't look right. Max allowed is 120.")
        return value

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Name can't be blank.")
        return value

    def validate_phone(self, value):
        if value and not value.replace("+", "").replace("-", "").replace(" ", "").isdigit():
            raise serializers.ValidationError("Phone number can only have digits, spaces, + and -.")
        return value


class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = [
            "id", "name", "specialization", "email", "phone",
            "experience_years", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_experience_years(self, value):
        if value > 70:
            raise serializers.ValidationError("Experience can't be more than 70 years.")
        return value

    def validate_email(self, value):
        return value.lower().strip()


class MappingSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.name", read_only=True)
    doctor_specialization = serializers.CharField(source="doctor.specialization", read_only=True)

    class Meta:
        model = PatientDoctorMapping
        fields = [
            "id", "patient", "doctor", "patient_name",
            "doctor_name", "doctor_specialization", "assigned_at",
        ]
        read_only_fields = ["id", "assigned_at"]

    def validate_patient(self, patient):
        # you can only assign doctors to patients that you created
        user = self.context["request"].user
        if patient.created_by_id != user.id:
            raise serializers.ValidationError("You don't have access to this patient.")
        return patient

    def validate(self, attrs):
        if PatientDoctorMapping.objects.filter(
            patient=attrs["patient"], doctor=attrs["doctor"]
        ).exists():
            raise serializers.ValidationError("This doctor is already assigned to this patient.")
        return attrs
