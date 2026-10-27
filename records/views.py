from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Doctor, Patient, PatientDoctorMapping
from .permissions import IsCreatorOrReadOnly
from .serializers import DoctorSerializer, MappingSerializer, PatientSerializer


class PatientViewSet(viewsets.ModelViewSet):
    serializer_class = PatientSerializer

    def get_queryset(self):
        # other users' patients simply don't exist as far as this user is concerned (404)
        return Patient.objects.filter(created_by=self.request.user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated, IsCreatorOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MappingListCreateView(APIView):
    def get(self, request):
        mappings = PatientDoctorMapping.objects.filter(
            patient__created_by=request.user
        ).select_related("patient", "doctor")
        return Response(MappingSerializer(mappings, many=True).data)

    def post(self, request):
        serializer = MappingSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save(assigned_by=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MappingDetailView(APIView):
    """
    The assignment uses the same URL shape for two different things:
      GET    /api/mappings/<patient_id>/  -> doctors assigned to that patient
      DELETE /api/mappings/<id>/          -> remove that mapping
    so GET reads the number as a patient id and DELETE reads it as a mapping id.
    """

    def get(self, request, pk):
        patient = get_object_or_404(Patient, pk=pk, created_by=request.user)
        mappings = patient.mappings.select_related("doctor", "patient")
        return Response(MappingSerializer(mappings, many=True).data)

    def delete(self, request, pk):
        mapping = get_object_or_404(PatientDoctorMapping, pk=pk, patient__created_by=request.user)
        mapping.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
