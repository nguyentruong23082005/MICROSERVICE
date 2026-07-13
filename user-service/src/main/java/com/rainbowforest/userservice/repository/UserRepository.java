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
            where (:search is null
               or lower(u.userName) like lower(concat('%', :search, '%'))
               or lower(d.firstName) like lower(concat('%', :search, '%'))
               or lower(d.lastName) like lower(concat('%', :search, '%'))
               or lower(d.email) like lower(concat('%', :search, '%'))
               or lower(d.phoneNumber) like lower(concat('%', :search, '%')))
            """)
    Page<User> searchUsersAdmin(@Param("search") String search, Pageable pageable);
}
