from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Doctor, Patient


class HealthcareAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user("a@test.com", "a@test.com", "pass12345", first_name="A")
        self.other = User.objects.create_user("b@test.com", "b@test.com", "pass12345", first_name="B")
        self.login(self.user)

    def login(self, user):
        res = self.client.post("/api/auth/login/", {"email": user.email, "password": "pass12345"})
        self.assertEqual(res.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_register_and_duplicate(self):
        self.client.credentials()
        body = {"name": "New", "email": "new@test.com", "password": "strongpass99"}
        self.assertEqual(self.client.post("/api/auth/register/", body).status_code, 201)
        self.assertEqual(self.client.post("/api/auth/register/", body).status_code, 400)

    def test_bad_login(self):
        res = self.client.post("/api/auth/login/", {"email": "a@test.com", "password": "nope"})
        self.assertEqual(res.status_code, 400)

    def test_requires_auth(self):
        self.client.credentials()
        self.assertEqual(self.client.get("/api/patients/").status_code, 401)

    def test_patient_crud_and_isolation(self):
        res = self.client.post("/api/patients/", {"name": "Ravi", "age": 40, "gender": "M"})
        self.assertEqual(res.status_code, 201)
        pid = res.data["id"]
        self.assertEqual(self.client.put(f"/api/patients/{pid}/", {"name": "Ravi K", "age": 41, "gender": "M"}).status_code, 200)
        self.login(self.other)
        self.assertEqual(len(self.client.get("/api/patients/").data), 0)
        self.assertEqual(self.client.get(f"/api/patients/{pid}/").status_code, 404)
        self.login(self.user)
        self.assertEqual(self.client.delete(f"/api/patients/{pid}/").status_code, 204)

    def test_patient_validation(self):
        res = self.client.post("/api/patients/", {"name": "X", "age": 200, "gender": "M"})
        self.assertEqual(res.status_code, 400)

    def test_doctor_only_creator_can_edit(self):
        res = self.client.post("/api/doctors/", {"name": "Meera", "specialization": "Cardiology", "email": "m@h.com"})
        self.assertEqual(res.status_code, 201)
        did = res.data["id"]
        self.login(self.other)
        self.assertEqual(len(self.client.get("/api/doctors/").data), 1)
        self.assertEqual(self.client.delete(f"/api/doctors/{did}/").status_code, 403)

    def test_mapping_flow(self):
        p = Patient.objects.create(name="P", age=30, gender="F", created_by=self.user)
        d = Doctor.objects.create(name="D", specialization="ENT", email="d@h.com", created_by=self.user)
        res = self.client.post("/api/mappings/", {"patient": p.id, "doctor": d.id})
        self.assertEqual(res.status_code, 201)
        self.assertEqual(self.client.post("/api/mappings/", {"patient": p.id, "doctor": d.id}).status_code, 400)
        self.assertEqual(len(self.client.get("/api/mappings/").data), 1)
        self.assertEqual(len(self.client.get(f"/api/mappings/{p.id}/").data), 1)
        self.assertEqual(self.client.delete(f"/api/mappings/{res.data['id']}/").status_code, 204)

    def test_cannot_map_someone_elses_patient(self):
        p = Patient.objects.create(name="P", age=30, gender="F", created_by=self.other)
        d = Doctor.objects.create(name="D", specialization="ENT", email="d@h.com", created_by=self.user)
        self.assertEqual(self.client.post("/api/mappings/", {"patient": p.id, "doctor": d.id}).status_code, 400)


class HomePageTests(APITestCase):
    def test_home_page_and_static_files_load(self):
        from django.contrib.staticfiles import finders

        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, "/static/css/style.css")
        self.assertIsNotNone(finders.find("css/style.css"))
        self.assertIsNotNone(finders.find("js/main.js"))
