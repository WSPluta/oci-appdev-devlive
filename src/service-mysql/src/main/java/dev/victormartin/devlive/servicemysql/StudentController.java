package dev.victormartin.devlive.servicemysql;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
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
}
