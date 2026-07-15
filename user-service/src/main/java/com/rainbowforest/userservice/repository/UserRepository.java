package com.rainbowforest.userservice.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.rainbowforest.userservice.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUserName(String userName);

    @Query("""
            select u from User u
            left join u.userDetails d
            where lower(u.userName) like :search
               or lower(d.firstName) like :search
               or lower(d.lastName) like :search
               or lower(d.email) like :search
               or lower(d.phoneNumber) like :search
            """)
    Page<User> searchUsersAdmin(@Param("search") String search, Pageable pageable);
}
