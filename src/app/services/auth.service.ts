import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData: Observable<firebase.default.User>
  private currentUser: UserData
  private currentUser$ = new BehaviorSubject<UserData>(null)
  defaultAvatar: string = 'https://portal.staralliance.com/cms/aux-pictures/prototype-images/avatar-default.png/@@images/image.png';

  constructor(private afs: AngularFirestore, private afAuth: AngularFireAuth, private router: Router) {
    this.userData = afAuth.authState;
    this.userData.subscribe(user => {
      if (user) {
        afs.collection<UserData>('users')
          .doc<UserData>(user.uid)
          .valueChanges()
          .subscribe(currentUser => {
            if (currentUser !== undefined) {
              this.currentUser = currentUser;
              this.currentUser$.next(this.currentUser);
            } else {
              this.currentUser = null;
              this.currentUser$.next(this.currentUser);
            }
          })
      }
    })
  }

  CurrentUser(): Observable<UserData> {
    return this.currentUser$.asObservable();
  }

  SignUp(firstName: string,
    lastName: string,
    avatar: string,
    email: string,
    password: string
  ): void {

    this.afAuth.createUserWithEmailAndPassword(email.trim(), password)
      .then(res => {
        if (res) {
          if (avatar === undefined || avatar === '') {
            avatar = this.defaultAvatar;
          }
          this.afs.collection('users').doc(res.user.uid)
            .set({
              firstName,
              lastName,
              email,
              avatar
            }).then(value => {
              this.afs.collection<UserData>('users')
                .doc<UserData>(res.user.uid)
                .valueChanges()
                .subscribe(user => {
                  if (user) {
                    this.currentUser$.next(user);
                  }
                });

            });
        }
      })
      .catch(err => console.log(`Something went wrong ${err.message}`));
  }

  get UserData(): Observable<firebase.default.User> {
    return this.userData;
  }

  SignIn(email: string, password: string): void {
    console.log(email, password);

    this.afAuth.signInWithEmailAndPassword(email.trim(), password)
      .then(res => {
        console.log(res);
        this.userData = this.afAuth.authState;

        this.afs.collection<UserData>('users')
          .doc<UserData>(res.user.uid)
          .valueChanges()
          .subscribe((user) => {
            this.currentUser = user;
            this.currentUser$.next(this.currentUser);
          });


      }).catch(err => console.log(err.message));
  }

  Logout(): void {
    this.afAuth.signOut().then(res => {
      console.log(res);
      this.currentUser = null;
      this.currentUser$.next(this.currentUser);
      this.router.navigateByUrl('/login').then();
    });
  }

  searchUserInDatabase(user_id: string): Observable<UserData> {
    return this.afs.collection<UserData>('users').doc<UserData>(user_id).valueChanges();
  }

}

export interface UserData {
  firstName: string,
  lastName: string,
  avatar: string,
  email: string,
  id?: string
}
