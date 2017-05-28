game-combinator ([Demo](https://abagames.github.io/game-combinator/))
======================
Combine games and generate a new one. (Experimental, WIP)

### How to work

Combine the games randomly...

![helmet](https://abagames.github.io/game-combinator/img/helmet.gif) ![flap](https://abagames.github.io/game-combinator/img/flap.gif)

```
(game helmet                                     (game flap
  (actor stage                                     (actor stage
    (if initial (spawn player))                      (if initial (spawn player))
    (if (random frequently) (spawn enemy))           (if (random frequently) (spawn enemy))
  )                                                )
  (actor player                                    (actor player
    (if initial (place bottom_left))                 (if initial (place left_center))
    (if (key left) (move left))      CROSSOVER       (if (key up) (accelerate up fast))
    (accelerate down normal)    <------------------
                                 ------------------> (if (key right) (move right))
    (if (touch out_of_screen_right) (                (if (touch out_of_screen) miss)
      score                                          (if (touch enemy) miss)
      (place bottom_left)                          )
    ))
    (if (touch out_of_screen) (move step_back))  
  )
  (actor enemy                                     (actor enemy
    (if initial (place top))         CROSSOVER       (if initial (place right))
                                 ------------------> (accelerate down normal)
    (move left)                 <------------------
    (if (touch player) miss)                         (if (touch out_of_screen) (
    (if (touch out_of_screen) remove)                  score
  )                                                    remove
)                                                    ))
                                                   )
                                                 )
```

and pray that it becomes a game.

![generated](https://abagames.github.io/game-combinator/img/generated.gif)

### Examples of generated games

[Avoid falling](https://abagames.github.io/game-combinator/?v=1&c=NoIg5ghgtgpiA0IBmAnA9lA+ktBXFCoEAxgC5oGIDOpEYc8oAlkoSChAHYAmGCIaJKRicQAXTGJyuYgAs2Lfk05NSTCABs2KJmFml+VAA4QA7qMRGNEAJ4wCExiEVOOPPolQwAjrhGkNG3EnYzMLEAAjXA0NGAMJSSIyCn4rW3sFVkRlVXUtJzTiBhAizmEHROcs0ABrGCDEWKFg0Cg0ADdipvjKl1r6-h09eKc2zsHdfXFe6pA6hpBcIxaQMeKl6ac+uYHEXnMVtf590UdmWek5fjxSTEFMKmIUGBFDjuKaGCNMCIgazfObEu8kQURicWCqyYVCoAJAJHIlEi0ViBlG72OaAOMyUKjUmjYVBgsTIhFAhWK5GWlRIRViHGEmIOiE6KBs2AgNAB5OsRX4ETQpHIUBWtOJ9ggjMQGxZ9nZSE5PUYPJIXRgzRpxDpEql7EmaJArPliu5IApE2Goq14oZauasrZHK5CRxTmBqWsdgciCg0NhrtA7sQNzuSAeTxepxCxAoxWeRxdQA) /
[rainy](https://abagames.github.io/game-combinator/?v=1&c=NoIg5ghgtgpiA0IBmAnA9lA+ktBXFCoEAxgC5oGIDOpEYc8oAlkoSChAHYAmGCIaJKRicQAXTGJyuYgAs2Lfk05NSTCABs2KJmFml+VAA4QA7qMRGNEAJ4wCExiEVOOPPolQwAjrhGkNG3EnYzMLEAAjXA0NGAMJSSIyCn4rW3sFVkRlVXUtJzTiBhAizmEHROcs0ABrGCDEWKFg0Cg0ADdipvjKl1r6-h09eKc2zsHdfXFe6pA6hpBcIxaQMeKl6ac+http://localhost:8080/?v=1&c=NoIg5ghgtgpiA0IBOB7CATBoIGMAuKSCIAznhGHPKAJYBmxNAdjXjRADZakAOEA7k2I8OEAJ4wiAXSnUQ9RizacsoEn0HDRE6YnUChiGExhQxIGbOz5CW8ZO4LEzVuy5yRuKiABGKPARQAPo4xngOMnJOoADWMOaIHDB0eBZyuKFJSBDhxEkpxABukmJBdBBkFlbyDHJxCcg0YAAWqdUZMFk53khNrUUlZRVt7TiZkt3EJBwo-EHos0LV0SAEAK44zcQoa3hBKHRBJDhIMMZpwKBQKMVT4TxBPrgxFyAdXbmIfmtMoUHNhBoAC8UExyFxLHocIQqLRaqB1pspgC2ogoDQSCRXitEVsvmsOElUSB0ZiqukbEQjCYzI5avIlG5uJ5QsQCA9QmCIst4cgIEwFlBiHRTgBHNZhDjmUbjbKfED5VKIcqVSJwxSuFRyfSaPQaQwgTw6cnquTZAUoIXKsUSsFS17vCby3otJUgFUjKK83HbXb7Q7HU7nWTIUw3OA87g+xA7PYHI4nM5LahXcN3GAPJ44F4yzpO7zfX4wf6AkFglSQtT65H+V46g0+AlEk1vSk1pWmhma9ygFnedktpxd5Q91uyyaJZJu4pIUoelvXW6IBaaSNm-mC7YpYMU8fy6azeaLQfenZImN++OBpNpUOLiOjAhU3xNmAdmrEU737H0lwj7iOnKPR9NOgzzmqJJpsux5rqA5qbjG27JtYe7eAecwrkssGrGeeIgLG-oJkGyZ3mmlhAA) /
[racket fire](https://abagames.github.io/game-combinator/?v=1&c=NoIg5ghgtgpiA0IBmBLATneoIGMAuA9mgiAM54RiZkAOEA7gHYKgECueA+gUp6ThhjNE7Ljz4CYQkqTpMSNADYQAnjGIBdLCCW5qunHC2gUSFiDQRGAEwJQSljIpUhjtBsJBCYUFxv-auITEiLpqISZm2gDWMC6IijBIeK7aUAQAbtSJya5upuax8RYoYAAWKW7pWQ6lFXnaBdqEbDhlJKLcvPyCzFWZRgHY+EQk3r7mTSAojCh4KBCKLKAG1IQ0nDmVgTiGiZZ41Gh1KYhIEOR5brh76hCHJLbyiIxEUIupkeYtbQrK4Z8yDgiJhhrcDtQAEbsRiGThZNDzHAffo1RBsGhXRpRUA-doiDhdCS9TjQvCEexaEBQFCkUiApq49i-AlibqSIScY7lbYWHwDK5AA)

### Libraries

[s-expression](https://github.com/fwg/s-expression) /
[lz-string](http://pieroxy.net/blog/pages/lz-string/index.html) /
[lodash](https://lodash.com/)
