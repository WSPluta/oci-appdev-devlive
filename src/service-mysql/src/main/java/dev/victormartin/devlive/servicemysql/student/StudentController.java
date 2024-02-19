package dev.victormartin.devlive.servicemysql.student;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.List;

@Controller
@RequestMapping(path = "/students")
public class StudentController {
    private StudentRepository studentRepository;

    @GetMapping(path = "/")
    public List<Student> getStudents() {
        return studentRepository.findAll();
    }

    @PostMapping(path = "/")
    public StudentCreateResponse createStudent(StudentCreateRequest request) {
        Student student = new Student(request.name(), request.email());
        Student savedStudent = studentRepository.save(student);
        StudentCreateResponse response = new StudentCreateResponse(
                savedStudent.getName(), savedStudent.getMail());
        return response;
    }
}
