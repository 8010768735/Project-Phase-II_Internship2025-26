package com.coffee.controller;



import org.springframework.web.bind.annotation.*;

import com.coffee.entity.CafeTable;
import com.coffee.service.CafeTableService;

import java.util.List;

@RestController
@RequestMapping("/api/tables")
@CrossOrigin
public class CafeTableController {

    private final CafeTableService service;

    public CafeTableController(CafeTableService service){
        this.service = service;
    }

    @PostMapping
    public CafeTable addTable(@RequestBody CafeTable table){
        return service.addTable(table);
    }

    @GetMapping("/cafe/{cafeId}")
    public List<CafeTable> getTables(@PathVariable Long cafeId){
        return service.getTablesByCafe(cafeId);
    }

    @PutMapping("/{id}")
    public CafeTable update(@PathVariable Long id,@RequestBody CafeTable table){
        return service.updateTable(id,table);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id){
        service.deleteTable(id);
    }

}
