package com.coffee.service;


import org.springframework.stereotype.Service;

import com.coffee.entity.CafeTable;
import com.coffee.repository.CafeTableRepository;

import java.util.List;

@Service
public class CafeTableService {

    private final CafeTableRepository repo;

    public CafeTableService(CafeTableRepository repo){
        this.repo = repo;
    }

    public CafeTable addTable(CafeTable table){
        return repo.save(table);
    }

    public List<CafeTable> getTablesByCafe(Long cafeId){
        return repo.findByCafeId(cafeId);
    }

    public CafeTable updateTable(Long id,CafeTable table){

        CafeTable existing = repo.findById(id).orElseThrow();

        existing.setCafeId(table.getCafeId());
        existing.setTableNumber(table.getTableNumber());
        existing.setSeats(table.getSeats());
        existing.setPrice(table.getPrice());
        existing.setTableType(table.getTableType());
        existing.setImageUrl(table.getImageUrl());

        return repo.save(existing);
    }

    public void deleteTable(Long id){
        repo.deleteById(id);
    }
}
