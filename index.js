window.addEventListener('load', function () {





    var imageSrc = document.getElementById('imageSrc')
    var inputImage = document.getElementById('inputImage')
    var getCamera = document.getElementById('getCamera')
    var video = document.getElementById('video')
    var imgDiv = this.document.getElementById('imgDiv')

    var all_Point_XY = []
    var color = new cv.Scalar(255, 0, 0, 255);

    imageSrc.onload = function () {

        let src = cv.imread(imageSrc);
        let src2 = cv.imread(imageSrc);

        //辨識
        detection(src)

        //比較
        compare()

        for (let i = 0; i < all_Point_XY.length; i++) {
            var temp = i;



            setTimeout(function () {

                drawRectangle(all_Point_XY[i],color,src)
                cv.imshow('imgOutput', src);

                let dst = new cv.Mat();


                console.log(all_Point_XY[i]);

                let xPointArr=[];
                let yPointArr=[];

                for (let index = 0; index < all_Point_XY[i].length; index++) {
                    xPointArr.push(all_Point_XY[i][index]['x'])
                    yPointArr.push(all_Point_XY[i][index]['y'])
                }
                

                let leftTopX = Math.min(...xPointArr)
                let leftTopY = Math.min(...yPointArr)
                
                let rightBottomX = Math.max(...xPointArr)
                let rightBottomY = Math.max(...yPointArr)

                let width = rightBottomX-leftTopX;
                let height = rightBottomY-leftTopY;

                console.log(width);
                console.log(height);
                // let x = all_Point_XY[i][0]['x'];
                // let y = all_Point_XY[i][0]['y'];
                // let width = all_Point_XY[i]['width'];
                // let height = all_Point_XY[i]['height'];



                

                let rect = new cv.Rect(leftTopX, leftTopY, width, height);
                dst = src2.roi(rect);
                cv.imshow('canvasCutOutput', dst);
                let canvas = document.getElementById("canvasCutOutput");
                let dataURL = canvas.toDataURL();

                let img = document.createElement('img');
                img.src = dataURL;
                img.style.margin = "25px";
                imgDiv.appendChild(img);
                dst.delete();

                // let imgData = new ImageData(new Uint8ClampedArray(dst.data),dst.cols, dst.rows);
                // console.log(imgData);
                // let canvas = document.getElementById("canvasOutput");
                // let ctx = canvas.getContext('2d');
                // canvas.width = imgData.width;
                // canvas.height = imgData.height;
                // ctx.clearRect(0, 0, canvas.width, canvas.height);
                // ctx.putImageData(imgData, 0, 0);

                if (i === all_Point_XY.length - 1) {
                    src.delete();
                }

            }, 1000 * (i + 1));


        }


        function compare() {

            //第i個輪廓
            for (let i = 0; i < all_Point_XY.length; i++) {

                //第0個和第0+1個比較
                //如果相近就刪除第0+1個

                // 下一次for loop
                // 變成第1個和第1-1個
                // 和第1+1個比較
                var num1, num2, num3;
                var currentNum, nextNum, PreviousNum;

                if (i === 0) {

                    num1 = all_Point_XY[i][0]['total']
                    num2 = all_Point_XY[i + 1][0]['total']
                    let comNum = Math.abs(num1 - num2)
                    if (0 < comNum && comNum < 15) {
                        all_Point_XY.splice(i + 1, 1)
                    }
                }
                if (0 < i && i < all_Point_XY.length - 1) {

                    currentNum = all_Point_XY[i][0]['total']

                    nextNum = all_Point_XY[i + 1][0]['total']
                    //後
                    PreviousNum = all_Point_XY[i - 1][0]['total']
                    //前

                    let comNum1 = Math.abs(currentNum - PreviousNum)
                    let comNum2 = Math.abs(currentNum - nextNum)

                    if (0 < comNum1 && comNum1 < 15) {
                        all_Point_XY.splice(i - 1, 1)
                    }
                    if (0 < comNum2 && comNum2 < 15) {
                        all_Point_XY.splice(i + 1, 1)
                    }
                }

                if (i == all_Point_XY.length - 1) {
                    num1 = all_Point_XY[i][0]['total']
                    num2 = all_Point_XY[i - 1][0]['total']
                    let comNum = Math.abs(num1 - num2)
                    if (0 < comNum && comNum < 15) {
                        all_Point_XY.splice(i, 1)
                    }
                }
            }

        }

    }


    inputImage.addEventListener('change', (e) => {
        imageSrc.src = URL.createObjectURL(e.target.files[0])
    })



    function detection(src) {

        let dst = new cv.Mat();
        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();

        cv.cvtColor(src, dst, cv.COLOR_BGR2GRAY, 0);

        cv.threshold(dst, dst, 78, 255, cv.THRESH_BINARY)

        cv.findContours(dst, contours, hierarchy, cv.RETR_TREE, cv.CHAIN_APPROX_SIMPLE)

        var point_XY
        var lock = 1;

        for (let i = 0; i < contours.size(); ++i) {
            point_XY = []

            const ci = contours.get(i)
            let peri1 = cv.arcLength(ci, true);
            let peri2 = 0.01 * peri1;

            let approx = new cv.Mat();
            cv.approxPolyDP(ci, approx, peri2, true);

            if (approx.rows == 4 && peri2 > 6.5 && peri2 < 15.0) {

                lock = 1;

                for (let i = 0; i < approx.data32S.length; i += 2) {

                    let cnt = []


                    cnt['x'] = approx.data32S[i]
                    cnt['y'] = approx.data32S[i + 1]


                    cnt['total'] = cnt['x'] + cnt['y']

                    point_XY.push(cnt)

                    cnt = []
                }



                if (lock) {
                    var point_XY = quickSort(point_XY, 0, point_XY.length - 1);
                    var width = point_XY[3]['x'] - point_XY[0]['x']
                    var height = point_XY[3]['y'] - point_XY[0]['y']

                    point_XY['width'] = width;
                    point_XY['height'] = height;

                    all_Point_XY.push(point_XY)
                    // let color = new cv.Scalar(255, 0, 0, 255);
                    // let point0 = new cv.Point(point_XY[1][0], point_XY[1][1]);
                    // let point1 = new cv.Point(point_XY[0][0], point_XY[0][1]);
                    // let point2 = new cv.Point(point_XY[3][0], point_XY[3][1]);
                    // let point4 = new cv.Point(point_XY[2][0], point_XY[2][1]);
                    // cv.line(src, point0, point1, color, 2, cv.LINE_AA, 0)
                    // cv.line(src, point0, point2, color, 2, cv.LINE_AA, 0)
                    // cv.line(src, point4, point1, color, 2, cv.LINE_AA, 0)
                    // cv.line(src, point4, point2, color, 2, cv.LINE_AA, 0)
                    lock = 0;
                }
            }
        }


        dst.delete();
        contours.delete();
        hierarchy.delete();

    }

    function drawRectangle(params, color, src) {

        let point0 = new cv.Point(params[0]['x'], params[0]['y']);
        let point1 = new cv.Point(params[1]['x'], params[1]['y']);
        let point2 = new cv.Point(params[2]['x'], params[2]['y']);
        let point4 = new cv.Point(params[3]['x'], params[3]['y']);

        cv.line(src, point0, point1, color, 1, cv.LINE_AA, 0)
        cv.line(src, point0, point2, color, 1, cv.LINE_AA, 0)
        cv.line(src, point4, point1, color, 1, cv.LINE_AA, 0)
        cv.line(src, point4, point2, color, 1, cv.LINE_AA, 0)


    }

    function swap(items, leftIndex, rightIndex) {
        var temp = items[leftIndex];
        items[leftIndex] = items[rightIndex];
        items[rightIndex] = temp;
    }

    function partition(items, left, right) {

        var pivot = items[Math.floor((right + left) / 2)]['total'], //middle element
            i = left, //left pointer
            j = right; //right pointer


        while (i <= j) {
            while (items[i]['total'] < pivot) {
                i++;
            }

            while (items[j]['total'] > pivot) {
                j--;
            }
            if (i <= j) {
                swap(items, i, j); //sawpping two elements
                i++;
                j--;
            }
        }
        return i;
    }

    function quickSort(items, left, right) {
        var index;
        if (items.length > 1) {
            index = partition(items, left, right); //index returned from partition
            if (left < index - 1) { //more elements on the left side of the pivot
                quickSort(items, left, index - 1);
            }
            if (index < right) { //more elements on the right side of the pivot
                quickSort(items, index, right);
            }
        }
        return items;
    }



});