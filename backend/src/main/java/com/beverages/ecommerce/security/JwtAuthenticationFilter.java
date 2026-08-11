package com.beverages.ecommerce.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

import com.beverages.ecommerce.repository.JwtTokenRepository;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final JwtTokenRepository jwtTokenRepository;

    public JwtAuthenticationFilter(JwtService jwtService,
                                   CustomUserDetailsService userDetailsService,
                                   JwtTokenRepository jwtTokenRepository) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.jwtTokenRepository = jwtTokenRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt)) {
                try {
                    if (jwtService.validateToken(jwt)) {
                        boolean isBlacklisted = jwtTokenRepository.findByToken(jwt)
                                .map(t -> t.getIsRevoked() || t.getIsExpired())
                                .orElse(false);

                        if (!isBlacklisted) {
                            String username = jwtService.getUsernameFromJWT(jwt);

                            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                            // Do not authenticate disabled accounts even with a valid token.
                            if (userDetails.isEnabled()) {
                                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                                SecurityContextHolder.getContext().setAuthentication(authentication);
                            }
                        }
                    }
                } catch (io.jsonwebtoken.ExpiredJwtException ex) {
                    request.setAttribute("exception", "JWT Expired");
                } catch (io.jsonwebtoken.security.SignatureException | io.jsonwebtoken.MalformedJwtException ex) {
                    request.setAttribute("exception", "Token Invalid");
                } catch (Exception ex) {
                    request.setAttribute("exception", "Token Invalid");
                }
            }
        } catch (Exception ex) {
            // General filter exception
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
