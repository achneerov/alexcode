import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class ProblemDataService {
  constructor(private http: HttpClient) {}

  getProblemData(id: string): Observable<any> {
    return this.http.get(`/problem/${id}.json`);
  }
}
